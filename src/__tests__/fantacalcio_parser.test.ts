import { describe, it, expect, beforeEach } from 'vitest';
import {
  matchManagerId,
  getSuggestedNextSeason,
  getManagerHistoricalDefaults,
  parseFantacalcioText,
  parseFantacalcioHtml
} from '@/utils/fantacalcioParser';
import { state } from '@/state';
import type { Manager, CompetitionRecord } from '@/types';
import dataJson from '../../public/data.json';

describe('Fantacalcio Parser & Entity Resolution Engine', () => {
  beforeEach(() => {
    state.managers = dataJson.leagueData as unknown as Manager[];
    state.competitions = dataJson.competitions as unknown as CompetitionRecord[];
  });

  describe('matchManagerId', () => {
    it('matches manager by known coach alias', () => {
      expect(matchManagerId('gizza', 'Any Team')).toBe('m_gizza');
      expect(matchManagerId('peterdani', 'Any Team')).toBe('m_peterdani');
      expect(matchManagerId('valery', 'Any Team')).toBe('m_valery');
      expect(matchManagerId('lucchetto', 'Any Team')).toBe('m_lucchetto');
      expect(matchManagerId('mf', 'Any Team')).toBe('m_mf');
    });

    it('matches manager by co-manager alias', () => {
      expect(matchManagerId('peterdani & daniele', 'Any Team')).toBe('m_peterdani');
      expect(matchManagerId('peter & dani', 'Any Team')).toBe('m_peterdani');
      expect(matchManagerId('mauro ttc', 'Any Team')).toBe('m_mauro_ttc');
    });

    it('matches manager by team keyword fallback', () => {
      expect(matchManagerId(undefined, 'Vrace FRC')).toBe('m_gizza');
      expect(matchManagerId('', 'Grassotthers')).toBe('m_peterdani');
      expect(matchManagerId(undefined, 'Scalo San Genesio')).toBe('m_valery');
      expect(matchManagerId(undefined, 'Iron Hill warriors')).toBe('m_mf');
    });

    it('returns undefined for unknown coach and team', () => {
      expect(matchManagerId('sconosciuto999', 'Squadra Fantasma')).toBeUndefined();
    });
  });

  describe('getSuggestedNextSeason', () => {
    it('suggests the next chronological season', () => {
      const nextSeason = getSuggestedNextSeason(state.competitions);
      expect(nextSeason).toMatch(/^\d{4}\/\d{2}$/);
      expect(nextSeason).toBe('2027/28');
    });
  });

  describe('getManagerHistoricalDefaults', () => {
    it('extracts latest team, historical teams, and coach for a known manager', () => {
      const defaults = getManagerHistoricalDefaults('m_gizza', state.managers, state.competitions);
      expect(defaults.latestTeam).toBe('Vrace FRC');
      expect(defaults.allTeams.length).toBeGreaterThanOrEqual(1);
      expect(defaults.coach).toBeTruthy();
    });
  });

  describe('parseFantacalcioText', () => {
    it('parses official CSV export with headers, URL, and season detection', () => {
      const csvData = `
Classifica Campionato Mantrico 25-26,,,,,,,,,,,
https://leghe.fantacalcio.it/se55o-mantrico,,,,,,,,,,,
,,,,,,,,,,,
Pos,Squadra,,G,V,N,P,Gf,Gs,Dr,Pt.,Pt. Totali
1,Grassotthers,,10,7,2,1,20,10,10,23,75.5
2,Vrace FRC,,10,6,2,2,18,12,6,20,73.0
3,Scalo San Genesio,,10,5,3,2,15,11,4,18,71.5
4,Iron Hill warriors,,10,1,1,8,8,22,-14,4,61.0
      `;

      const result = parseFantacalcioText(csvData, state.managers);
      expect(result.season).toBe('2025/26');
      expect(result.competitionName).toContain('Campionato Mantrico');
      expect(result.leagueUrl).toBe('https://leghe.fantacalcio.it/se55o-mantrico');
      expect(result.rows.length).toBe(4);

      expect(result.rows[0].rank).toBe(1);
      expect(result.rows[0].teamName).toBe('Grassotthers');
      expect(result.rows[0].points).toBe(23);
      expect(result.rows[0].matchedManagerId).toBe('m_peterdani');

      expect(result.rows[1].rank).toBe(2);
      expect(result.rows[1].teamName).toBe('Vrace FRC');
      expect(result.rows[1].points).toBe(20);
      expect(result.rows[1].matchedManagerId).toBe('m_gizza');

      expect(result.rows[2].rank).toBe(3);
      expect(result.rows[2].matchedManagerId).toBe('m_valery');

      expect(result.rows[3].rank).toBe(4);
      expect(result.rows[3].matchedManagerId).toBe('m_mf');
    });

    it('parses web TSV tab-delimited text', () => {
      const tsvData = `
Pos\tSquadra\tCoach\tPt
1\tVrace FRC\tgizza\t72
2\tGrassotthers\tpeterdani\t68
3\tScalo San Genesio\tvalery\t65
      `;

      const result = parseFantacalcioText(tsvData, state.managers);
      expect(result.rows.length).toBe(3);
      expect(result.rows[0].rank).toBe(1);
      expect(result.rows[0].teamName).toBe('Vrace FRC');
      expect(result.rows[0].coachName).toBe('gizza');
      expect(result.rows[0].points).toBe(72);
      expect(result.rows[0].matchedManagerId).toBe('m_gizza');
    });

    it('parses single-line regex entries', () => {
      const text = `
1. Vrace FRC gizza 74 pt
2. Grassotthers peterdani 70 pt
3. Scalo San Genesio valery 66 pt
      `;

      const result = parseFantacalcioText(text, state.managers);
      expect(result.rows.length).toBe(3);
      expect(result.rows[0].rank).toBe(1);
      expect(result.rows[0].points).toBe(74);
      expect(result.rows[0].matchedManagerId).toBe('m_gizza');
    });

    it('parses vertical multi-line cell blocks', () => {
      const vertical = `
1
Vrace FRC
gizza
75.5
2
Grassotthers
peterdani
71
      `;

      const result = parseFantacalcioText(vertical, state.managers);
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].rank).toBe(1);
      expect(result.rows[0].teamName).toBe('Vrace FRC');
      expect(result.rows[0].points).toBe(75.5);
      expect(result.rows[0].matchedManagerId).toBe('m_gizza');
    });
  });

  describe('parseFantacalcioHtml', () => {
    it('parses HTML table structure into rows', () => {
      const html = `
        <table>
          <tbody>
            <tr><td>1</td><td>Vrace FRC</td><td>gizza</td><td>78</td></tr>
            <tr><td>2</td><td>Grassotthers</td><td>peterdani</td><td>72</td></tr>
          </tbody>
        </table>
      `;

      const result = parseFantacalcioHtml(html, 'https://leghe.fantacalcio.it/test', state.managers);
      expect(result.leagueUrl).toBe('https://leghe.fantacalcio.it/test');
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].rank).toBe(1);
      expect(result.rows[0].teamName).toBe('Vrace FRC');
      expect(result.rows[0].points).toBe(78);
      expect(result.rows[0].matchedManagerId).toBe('m_gizza');
    });
  });
});

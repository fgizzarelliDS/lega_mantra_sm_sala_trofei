import { describe, it, expect, beforeAll } from 'vitest';
import { getSeasonMatchdays, computeAllLeagueRecords, filterRecordsByCategory } from '@/analytics/records';
import { getLeagueYearSpan } from '@/analytics/records/helpers';
import type { Manager, CompetitionRecord } from '@/types';
import dataJson from '../../public/data.json';

describe('All-Time League Records Engine', () => {
  let managers: Manager[];
  let competitions: CompetitionRecord[];

  beforeAll(() => {
    managers = (dataJson.leagueData || (dataJson as any).managers) as Manager[];
    competitions = (dataJson.competitions || []) as CompetitionRecord[];
  });

  describe('getSeasonMatchdays (Matchdays & Rounds Normalization)', () => {
    it('returns 35 matchdays (5 rounds) for 8-team seasons', () => {
      expect(getSeasonMatchdays('2016/17', 8)).toBe(35);
      expect(getSeasonMatchdays('2017/18', 8)).toBe(35);
    });

    it('returns 36 matchdays (4 rounds) for 10-team seasons and 27 for 2025/26', () => {
      expect(getSeasonMatchdays('2018/19', 10)).toBe(36);
      expect(getSeasonMatchdays('2019/20', 10)).toBe(36);
      expect(getSeasonMatchdays('2025/26', 10)).toBe(27);
    });

    it('returns 33 matchdays (3 rounds) for 12-team seasons', () => {
      expect(getSeasonMatchdays('2021/22', 12)).toBe(33);
      expect(getSeasonMatchdays('2022/23', 12)).toBe(33);
      expect(getSeasonMatchdays('2023/24', 12)).toBe(33);
      expect(getSeasonMatchdays('2024/25', 12)).toBe(33);
      expect(getSeasonMatchdays('2025/26', 12)).toBe(33);
    });

    it('returns 26 matchdays (2 rounds) for 14-team seasons', () => {
      expect(getSeasonMatchdays('2026/27', 14)).toBe(26);
    });
  });

  describe('computeAllLeagueRecords (Real Historical Data)', () => {
    it('computes all primary records across all categories', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      expect(records.length).toBeGreaterThanOrEqual(10);

      const categories = new Set(records.map(r => r.category));
      expect(categories.has('points')).toBe(true);
      expect(categories.has('titles')).toBe(true);
      expect(categories.has('h2h')).toBe(true);
      expect(categories.has('streaks')).toBe(true);
      expect(categories.has('banter')).toBe(true);
    });

    it('identifies Gizza as single-season points record holder (69.0 pt)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const pointsRec = records.find(r => r.id === 'max_single_season_points');
      expect(pointsRec).toBeDefined();
      expect(pointsRec!.primaryHolder.managerName).toBe('Gizza');
      expect(pointsRec!.primaryHolder.value).toBe(69.0);
      expect(pointsRec!.primaryHolder.formattedValue).toBe('69.0 pt');
      expect(pointsRec!.primaryHolder.season).toBe('2023/24');
    });

    it('identifies lowest points champion', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const lowScudetto = records.find(r => r.id === 'lowest_points_champion');
      expect(lowScudetto).toBeDefined();
      expect(lowScudetto!.primaryHolder.managerName).toBe('PeterDani');
      expect(lowScudetto!.primaryHolder.value).toBe(46.0);
      expect(lowScudetto!.primaryHolder.season).toBe('2025/26');
      expect(lowScudetto!.primaryHolder.normalizedDetail).toBe('1.70 pt/g · 27 giornate');
    });

    it('identifies tazio as highest points wooden spoon (32.0 pt in 2023/24)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const spoonRec = records.find(r => r.id === 'highest_points_wooden_spoon');
      expect(spoonRec).toBeDefined();
      expect(spoonRec!.primaryHolder.managerName).toBe('tazio');
      expect(spoonRec!.primaryHolder.value).toBe(32.0);
      expect(spoonRec!.primaryHolder.season).toBe('2023/24');
    });

    it('identifies biggest championship margin (+21.0 pt by MF in 2022/23)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const marginRec = records.find(r => r.id === 'biggest_championship_margin');
      expect(marginRec).toBeDefined();
      expect(marginRec!.primaryHolder.managerName).toBe('MF');
      expect(marginRec!.primaryHolder.value).toBe(21.0);
      expect(marginRec!.primaryHolder.formattedValue).toBe('+21.0 pt');
    });

    it('identifies tightest championship finish (+0.0 pt in 2025/26)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const tightRec = records.find(r => r.id === 'tightest_championship_finish');
      expect(tightRec).toBeDefined();
      expect(tightRec!.primaryHolder.value).toBe(0.0);
      expect(tightRec!.primaryHolder.season).toBe('2025/26');
    });

    it('identifies tightest podium race (5.0 pt in 2025/26)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const podRec = records.find(r => r.id === 'tightest_podium_race');
      expect(podRec).toBeDefined();
      expect(podRec!.primaryHolder.value).toBe(5.0);
      expect(podRec!.primaryHolder.season).toBe('2025/26');
    });

    it('identifies Luca as holder of longest podium streak (2 consecutive seasons)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const streakRec = records.find(r => r.id === 'consecutive_podium_streak');
      expect(streakRec).toBeDefined();
      expect(streakRec!.primaryHolder.managerName).toBe('Luca');
      expect(streakRec!.primaryHolder.value).toBe(2);
    });

    it('identifies Re dei Campionati and details only completed seasons', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const scudettiRec = records.find(r => r.id === 'most_scudetti');
      expect(scudettiRec).toBeDefined();
      expect(scudettiRec!.primaryHolder.value).toBe(1);
    });

    it('identifies Lucchetto as Mister Camaleonte (2 completed team names)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const camaleonteRec = records.find(r => r.id === 'chameleon_manager_names');
      expect(camaleonteRec).toBeDefined();
      expect(camaleonteRec!.primaryHolder.managerName).toBe('Lucchetto');
      expect(camaleonteRec!.primaryHolder.value).toBe(2);
    });

    it('identifies biggest H2H blowout (+44.0 pt)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const blowoutRec = records.find(r => r.id === 'biggest_h2h_blowout');
      expect(blowoutRec).toBeDefined();
      expect(blowoutRec!.primaryHolder.value).toBe(44.0);
      expect(blowoutRec!.primaryHolder.formattedValue).toBe('+44.0 pt');
    });

    it('identifies tied leaders for historical loyalty (4 completed seasons)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const loyaltyRec = records.find(r => r.id === 'most_seasons_loyalty');
      expect(loyaltyRec).toBeDefined();
      expect(loyaltyRec!.primaryHolders.length).toBeGreaterThanOrEqual(1);
      expect(loyaltyRec!.primaryHolders[0].value).toBe(4);
    });

    it('identifies Valery for biggest season climb (+8 positions in 2024/25)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const climbRec = records.find(r => r.id === 'biggest_season_climb');
      expect(climbRec).toBeDefined();
      expect(climbRec!.primaryHolder.managerName).toBe('Valery');
      expect(climbRec!.primaryHolder.value).toBe(8);
      expect(climbRec!.primaryHolder.formattedValue).toBe('+8 Posizioni');
      expect(climbRec!.primaryHolder.season).toBe('2024/25');
    });

    it('identifies title drought purgatory (4 completed seasons without gold)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const droughtRec = records.find(r => r.id === 'title_drought_purgatory');
      expect(droughtRec).toBeDefined();
      expect(droughtRec!.primaryHolders.length).toBeGreaterThanOrEqual(1);
      expect(droughtRec!.primaryHolders[0].value).toBe(4);
    });

    it('computes official league records across active categories (including debutant records)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      expect(records.length).toBeGreaterThanOrEqual(20);

      const ppgRec = records.find(r => r.id === 'debut_best_ppg');
      if (ppgRec) {
        expect(ppgRec.category).toBe('points');
        expect(ppgRec.primaryHolder).toBeDefined();
      }

      const rankRec = records.find(r => r.id === 'debut_best_rank');
      if (rankRec) {
        expect(rankRec.category).toBe('titles');
        expect(rankRec.primaryHolder).toBeDefined();
      }

      const disasterRec = records.find(r => r.id === 'debut_disaster');
      if (disasterRec) {
        expect(disasterRec.category).toBe('banter');
        expect(disasterRec.primaryHolder).toBeDefined();
      }
    });

    it('resolves pertinent crests and team names for both single-season and career records', async () => {
      const { resolveManagerRecordCrest } = await import('@/analytics/records');
      
      // Single season record: MF in 2022/23
      const mf2223 = resolveManagerRecordCrest('m_mf', '2022/23', undefined, managers, competitions);
      expect(mf2223.teamName).toBe('Iron Hill warriors');
      expect(mf2223.logo).toBeDefined();

      // Single season record: Gizza in 2023/24
      const gizza2324 = resolveManagerRecordCrest('m_gizza', '2023/24', undefined, managers, competitions);
      expect(gizza2324.teamName).toBe('Vrace FRC');
      expect(gizza2324.logo).toBeDefined();

      // Career record: Gizza gets latest franchise Vrace FRC
      const gizzaCareer = resolveManagerRecordCrest('m_gizza', undefined, undefined, managers, competitions);
      expect(gizzaCareer.teamName).toBe('Vrace FRC');
      expect(gizzaCareer.logo).toBeDefined();
    });

    it('identifies Gizza as Signore delle Coppe with cumulative knockout titles (3 cups)', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const cupsRec = records.find(r => r.id === 'most_cups');
      expect(cupsRec).toBeDefined();
      expect(cupsRec!.primaryHolder.managerName).toBe('Gizza');
      expect(cupsRec!.primaryHolder.value).toBe(3);
      expect(cupsRec!.primaryHolder.formattedValue).toBe('3 Coppe');
      expect(cupsRec!.watermark).toBe('🏆');
    });

    it('identifies Ale as worst career PPG', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const worstPpgRec = records.find(r => r.id === 'career_worst_ppg');
      expect(worstPpgRec).toBeDefined();
      expect(worstPpgRec!.primaryHolder.managerName).toBe('Ale');
      expect(worstPpgRec!.watermark).toBe('📉');
    });

    it('identifies PeterDani as Eterno Secondo nelle Coppe', () => {
      const records = computeAllLeagueRecords(managers, competitions);
      const cupSilverRec = records.find(r => r.id === 'eternal_second_cups');
      expect(cupSilverRec).toBeDefined();
      expect(cupSilverRec!.primaryHolder.value).toBe(2);
      expect(cupSilverRec!.watermark).toBe('💔');
    });
  });

  describe('renderRecordCard UI with Watermarks and Gazzetta Styles', () => {
    it('renders thematic watermark and eliminates hardcoded dark gray', async () => {
      const { renderRecordCard } = await import('@/components/board/records');
      const records = computeAllLeagueRecords(managers, competitions);
      const cupsRec = records.find(r => r.id === 'most_cups');
      expect(cupsRec).toBeDefined();

      const html = renderRecordCard(cupsRec!);
      expect(html).toContain('🏆');
      expect(html).toContain('group rounded-2xl');
      // Verify dirty gray rgba(0,0,0,0.12) is replaced with theme variables
      expect(html).not.toContain('rgba(0,0,0,0.12)');
      expect(html).toContain('background-color: var(--input-bg)');
      expect(html).toContain('border-color: var(--input-border)');
    });

    it('renders ex-aequo badge and grid when there are multiple co-holders', async () => {
      const { renderRecordCard } = await import('@/components/board/records');
      const records = computeAllLeagueRecords(managers, competitions);
      const loyaltyRec = records.find(r => r.id === 'most_seasons_loyalty');
      expect(loyaltyRec).toBeDefined();

      const html = renderRecordCard(loyaltyRec!);
      expect(html).toContain('Co-Primatisti (Pari Merito)');
      expect(html).toContain('Co-Primatisti');
      expect(html).toContain('Gizza');
    });

    it('renders mini-crests for runner-up contenders and high-contrast season pill', async () => {
      const { renderRecordCard } = await import('@/components/board/records');
      const records = computeAllLeagueRecords(managers, competitions);
      const pointsRec = records.find(r => r.id === 'max_single_season_points');
      expect(pointsRec).toBeDefined();

      const html = renderRecordCard(pointsRec!);
      expect(html).toContain('2023/24');
    });

    it('renders unique id, share button and export popover menu on each record card', async () => {
      const { renderRecordCard } = await import('@/components/board/records');
      const records = computeAllLeagueRecords(managers, competitions);
      const firstRec = records[0];

      const html = renderRecordCard(firstRec);
      expect(html).toContain(`id="record-card-${firstRec.id}"`);
      expect(html).toContain(`id="btn-record-share-${firstRec.id}"`);
      expect(html).toContain('Copia per WhatsApp');
      expect(html).toContain('Invia Link WhatsApp');
      expect(html).toContain(`shareRecordWhatsApp('${firstRec.id}')`);
      expect(html).toContain('Scarica PNG HD');
      expect(html).toContain('record-card-actions');
      expect(html).toContain('record-card-footer');
      expect(html).toContain('record-metric-row');
      expect(html).toContain('manager-record-name');
      expect(html).toContain('record-holder-logo');
      expect(html).toContain('record-watermark');
      expect(html).toContain('top-3 right-3');
    });

    it('computes the dynamic league year span without hardcoding', () => {
      const span = getLeagueYearSpan(competitions);
      expect(span.startYear).toBe(2022);
      expect(span.endYear).toBe(2026);
      expect(span.spanText).toBe('2022-2026');
      expect(span.completedCount).toBe(4);
    });
  });

  describe('filterRecordsByCategory', () => {
    it('returns all records when filter is "all"', () => {
      const all = computeAllLeagueRecords(managers, competitions);
      const filtered = filterRecordsByCategory(all, 'all');
      expect(filtered.length).toBe(all.length);
    });

    it('filters strictly by category', () => {
      const all = computeAllLeagueRecords(managers, competitions);
      const pointsOnly = filterRecordsByCategory(all, 'points');
      expect(pointsOnly.every(r => r.category === 'points')).toBe(true);

      const banterOnly = filterRecordsByCategory(all, 'banter');
      expect(banterOnly.every(r => r.category === 'banter')).toBe(true);
    });
  });

  describe('filterRecordsBySearch & Empty State', () => {
    it('returns all records when search query is empty', async () => {
      const { filterRecordsBySearch } = await import('@/components/board/records');
      const all = computeAllLeagueRecords(managers, competitions);
      expect(filterRecordsBySearch(all, '').length).toBe(all.length);
      expect(filterRecordsBySearch(all, '   ').length).toBe(all.length);
    });

    it('filters records by manager name case-insensitively', async () => {
      const { filterRecordsBySearch } = await import('@/components/board/records');
      const all = computeAllLeagueRecords(managers, competitions);
      const results = filterRecordsBySearch(all, 'gizza');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.primaryHolder.managerName.toLowerCase().includes('gizza'))).toBe(true);
    });

    it('filters records by record title keyword', async () => {
      const { filterRecordsBySearch } = await import('@/components/board/records');
      const all = computeAllLeagueRecords(managers, competitions);
      const results = filterRecordsBySearch(all, 'media');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.title.toLowerCase().includes('media'))).toBe(true);
    });

    it('filters records by team name', async () => {
      const { filterRecordsBySearch } = await import('@/components/board/records');
      const all = computeAllLeagueRecords(managers, competitions);
      const results = filterRecordsBySearch(all, 'vrace');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty array when search query matches nothing and renders empty state', async () => {
      const { filterRecordsBySearch, renderRecordsEmptyState } = await import('@/components/board/records');
      const all = computeAllLeagueRecords(managers, competitions);
      const results = filterRecordsBySearch(all, 'nonexistent_query_xyz');
      expect(results.length).toBe(0);

      const html = renderRecordsEmptyState('nonexistent_query_xyz');
      expect(html).toContain('Nessun primato trovato');
      expect(html).toContain('nonexistent_query_xyz');
      expect(html).toContain('Azzera Ricerca');
    });
  });

  describe('Dual-Target Record Holder & Season Standings Navigation', () => {
    it('generates interactive season links for records with a season and separate manager profile clicks', async () => {
      const { state } = await import('@/state');
      state.managers = managers;
      state.competitions = competitions;

      const { renderRecordsContentHTML } = await import('@/components/board/records');
      const html = renderRecordsContentHTML('all', '');

      // Records with season (like Volata Podio or Punti Singola Stagione) must contain navigateToSeasonStandings
      expect(html).toContain('navigateToSeasonStandings');
      // Manager name click must stop propagation and open profile modal
      expect(html).toContain('openProfileModal');
      expect(html).toContain('event.stopPropagation()');
    });

    it('navigates to season archive and updates selected season when navigateToSeasonStandings is called', async () => {
      const { navigateToSeasonStandings, getCurrentSelectedSeason } = await import('@/components/board/seasons');

      const originalDoc = (globalThis as any).document;
      try {
        const scrolledElements: any[] = [];
        const pulseClasses: string[] = [];
        const mockTargetRow = {
          scrollIntoView: (opts: any) => scrolledElements.push(opts),
          classList: {
            add: (c: string) => pulseClasses.push(c),
            remove: (c: string) => {
              const idx = pulseClasses.indexOf(c);
              if (idx >= 0) pulseClasses.splice(idx, 1);
            }
          },
          offsetWidth: 100
        };

        (globalThis as any).document = {
          getElementById: () => null,
          querySelector: (sel: string) => {
            if (sel.includes('m_makako')) return mockTargetRow;
            return null;
          }
        };

        const mockEvent = {
          stopPropagation: () => {},
          preventDefault: () => {}
        };

        navigateToSeasonStandings('2017/18', 'm_makako', mockEvent as any);

        expect(getCurrentSelectedSeason()).toBe('2017/18');
      } finally {
        (globalThis as any).document = originalDoc;
      }
    });

    it('adds data-manager-id to championship table rows for precise highlighting', async () => {
      const { renderChampionshipTable } = await import('@/components/board/seasons');
      const championshipComp = competitions.find(c => c.category === 'Campionato' || /campionato|serie\s*atlas/i.test(c.name))!;
      const html = renderChampionshipTable(championshipComp);

      expect(html).toContain('data-manager-id=');
      expect(html).toContain('id="standings-row-');
    });
  });
});


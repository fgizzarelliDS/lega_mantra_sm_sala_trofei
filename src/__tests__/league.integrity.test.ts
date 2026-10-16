import { describe, it, expect } from 'vitest';
import dataJson from '../../public/data.json';

describe('League Database Integrity (Se55o Mantrico)', () => {
  it('contains valid leagueData with chronological history and competitions archive', () => {
    expect(dataJson).toBeDefined();
    expect(Array.isArray(dataJson.leagueData)).toBe(true);
    expect(dataJson.leagueData.length).toBe(12);

    expect(Array.isArray(dataJson.competitions)).toBe(true);
    expect(dataJson.competitions.length).toBe(12);
  });

  it('ensures all managers have 100% consistency between top-level trophies and history achievements', () => {
    const badgeKeys = [
      'gold', 'silver', 'bronze', 'spoon',
      'cup_gold', 'cup_silver', 'supercup', 'supercup_silver',
      'mundialito', 'cartonato'
    ] as const;

    dataJson.leagueData.forEach((m: { name: string; history?: { achievements?: { badge?: string }[] }[] } & Record<string, unknown>) => {
      const counts: Record<string, number> = {};
      badgeKeys.forEach(k => { counts[k] = 0; });

      (m.history || []).forEach(h => {
        (h.achievements || []).forEach(a => {
          if (a.badge && a.badge in counts) {
            counts[a.badge]++;
          }
        });
      });

      badgeKeys.forEach(k => {
        const topVal = (m[k] as number) || 0;
        expect(topVal, `Manager ${m.name} mismatch on ${k}`).toBe(counts[k]);
      });
    });
  });

  it('ensures Gizza has strictly 1 Scudetto, 2 Coppe di Lega, 1 Supercoppa, and 4 completed seasons', () => {
    const gizza = dataJson.leagueData.find((m: { id: string }) => m.id === 'm_gizza');
    expect(gizza).toBeDefined();
    expect(gizza?.gold).toBe(1);
    expect(gizza?.silver).toBe(1);
    expect(gizza?.cup_gold).toBe(2);
    expect(gizza?.supercup).toBe(1);
    expect(gizza?.years).toBe(4);
    expect(gizza?.history.length).toBe(4);

    // Verify season 2023/24 championship gold
    const s2324 = gizza?.history.find((s: { season: string }) => s.season === '2023/24');
    expect(s2324).toBeDefined();
    expect(s2324?.rank).toBe(1);
    expect(s2324?.points).toBe(69.0);
  });

  it('ensures PeterDani & Daniele has 1 Scudetto, 2 Coppe di Lega, 1 Supercoppa across 4 completed seasons', () => {
    const peterdani = dataJson.leagueData.find((m: { id: string }) => m.id === 'm_peterdani');
    expect(peterdani).toBeDefined();
    expect(peterdani?.gold).toBe(1);
    expect(peterdani?.cup_gold).toBe(2);
    expect(peterdani?.supercup).toBe(1);
    expect(peterdani?.years).toBe(4);
    expect(peterdani?.history.length).toBe(4);
  });

  it('ensures MF has 1 Scudetto and 1 Supercoppa silver from inaugural 2022/23 season', () => {
    const mf = dataJson.leagueData.find((m: { id: string }) => m.id === 'm_mf');
    expect(mf).toBeDefined();
    expect(mf?.gold).toBe(1);
    expect(mf?.supercup_silver).toBe(1);
    expect(mf?.years).toBe(4);
    const s2223 = mf?.history.find((s: { season: string }) => s.season === '2022/23');
    expect(s2223?.rank).toBe(1);
    expect(s2223?.points).toBe(65.0);
  });

  it('ensures Valery has 1 Scudetto across 3 completed seasons', () => {
    const valery = dataJson.leagueData.find((m: { id: string }) => m.id === 'm_valery');
    expect(valery).toBeDefined();
    expect(valery?.gold).toBe(1);
    expect(valery?.years).toBe(3);
  });

  it('ensures all 4 wooden spoons are correctly distributed across historical seasons', () => {
    const spoons = dataJson.leagueData.filter((m: { spoon: number }) => m.spoon > 0);
    expect(spoons.length).toBe(4);
    const spoonIds = spoons.map((m: { id: string }) => m.id).sort();
    expect(spoonIds).toEqual(['m_ale', 'm_claudio', 'm_simone', 'm_tazio'].sort());
  });

  it('ensures each of the 4 completed seasons has exactly 1 championship, 1 cup, and 1 supercup', () => {
    const seasons = ['2022/23', '2023/24', '2024/25', '2025/26'];
    seasons.forEach(s => {
      const comps = dataJson.competitions.filter((c: { season: string }) => c.season === s);
      expect(comps.length, `Season ${s} should have 3 competitions`).toBe(3);
      const categories = comps.map((c: { category: string }) => c.category);
      expect(categories).toContain('Campionato');
      expect(categories).toContain('Coppa');
      expect(categories).toContain('Supercoppa');
    });
  });
});

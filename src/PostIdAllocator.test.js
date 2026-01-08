// Tests for PostIdAllocator
import { describe, it, expect } from 'vitest';
import { formatDayUTC, randomSlug } from './PostIdAllocator.js';

describe('formatDayUTC', () => {
  it('formats date as YYMMDD in UTC', () => {
    const date = new Date('2026-01-07T15:30:00Z');
    expect(formatDayUTC(date)).toBe('260107');
  });

  it('zero-pads single digits', () => {
    const date = new Date('2026-03-05T00:00:00Z');
    expect(formatDayUTC(date)).toBe('260305');
  });

  it('handles year 2099 correctly (Y2100 problem)', () => {
    const date = new Date('2099-12-31T23:59:59Z');
    expect(formatDayUTC(date)).toBe('991231');
  });

  it('handles year 2000 correctly', () => {
    const date = new Date('2000-01-01T00:00:00Z');
    expect(formatDayUTC(date)).toBe('000101');
  });
});

describe('randomSlug', () => {
  const ALPHABET = 'bcdfghjkmnpqrstvwxyz';

  it('generates slug of correct length', () => {
    expect(randomSlug(2)).toHaveLength(2);
    expect(randomSlug(3)).toHaveLength(3);
    expect(randomSlug(4)).toHaveLength(4);
    expect(randomSlug(5)).toHaveLength(5);
  });

  it('uses only characters from allowed alphabet', () => {
    for (let i = 0; i < 100; i++) {
      const slug = randomSlug(5);
      for (const char of slug) {
        expect(ALPHABET).toContain(char);
      }
    }
  });

  it('is lowercase only', () => {
    for (let i = 0; i < 100; i++) {
      const slug = randomSlug(5);
      expect(slug).toBe(slug.toLowerCase());
    }
  });

  it('generates different slugs (randomness check)', () => {
    const slugs = new Set();
    for (let i = 0; i < 100; i++) {
      slugs.add(randomSlug(5));
    }
    // With 20^5 = 3.2M possibilities, 100 samples should all be unique
    expect(slugs.size).toBe(100);
  });
});

describe('ID format validation', () => {
  it('matches expected regex pattern', () => {
    const idRegex = /^[0-9]{6}-[bcdfghjkmnpqrstvwxyz]{2,5}$/;

    // Test various lengths
    expect('260107-bc').toMatch(idRegex);
    expect('260107-bcf').toMatch(idRegex);
    expect('260107-bcfg').toMatch(idRegex);
    expect('260107-bcfgh').toMatch(idRegex);

    // Invalid formats
    expect('26010-bcf').not.toMatch(idRegex);      // date too short
    expect('260107-b').not.toMatch(idRegex);       // slug too short
    expect('260107-bcfghj').not.toMatch(idRegex);  // slug too long
    expect('260107-ABC').not.toMatch(idRegex);     // uppercase
    expect('260107-aef').not.toMatch(idRegex);     // vowel 'a'
    expect('260107-bce').not.toMatch(idRegex);     // vowel 'e'
  });
});

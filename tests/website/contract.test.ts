import { describe, it, expect } from 'vitest';
import { createDefaults, normalizeConfig, validateConfig, setAt } from '../../src/website/contract';

const company = { id: 'company', slug: 'tenant', name: 'Restaurant', currency: 'EGP', about: null, logoUrl: null, coverUrl: null };

describe('header and story schema additions', () => {
  it('defaults the new header/story fields to the pre-existing look', () => {
    const config = createDefaults(company);
    expect(config.header.variant).toBe('white');
    expect(config.header.customBackground).toBe('#ffffff');
    expect(config.header.navTextColor).toBe('#4f4a44');
    expect(config.pages.home.story.variant).toBe('image-left');
    expect(validateConfig(config, company.id)).toEqual([]);
  });

  it('fills header.customBackground and header.navTextColor into a draft saved before they existed', () => {
    const original = createDefaults(company);
    const legacy = structuredClone(original) as unknown as Record<string, unknown>;
    const header = { ...(legacy.header as Record<string, unknown>) };
    delete header.customBackground;
    delete header.navTextColor;
    legacy.header = header;
    const normalized = normalizeConfig(legacy) as typeof original;
    expect(normalized.header.customBackground).toBe('#ffffff');
    expect(normalized.header.navTextColor).toBe('#4f4a44');
    expect(normalized.header.variant).toBe(original.header.variant);
    expect(validateConfig(normalized, company.id)).toEqual([]);
  });

  it('accepts the new header "custom" variant and the new story variants', () => {
    for (const [path, value] of [
      ['header.variant', 'custom'],
      ['pages.home.story.variant', 'overlay'],
      ['pages.home.story.variant', 'editorial'],
    ] as const) {
      expect(validateConfig(setAt(createDefaults(company), path, value), company.id)).toEqual([]);
    }
  });

  it('still validates a stored draft that only ever used the original story variants', () => {
    for (const variant of ['image-left', 'image-right', 'text'] as const) {
      const config = setAt(createDefaults(company), 'pages.home.story.variant', variant);
      expect(validateConfig(config, company.id)).toEqual([]);
    }
  });

  it('rejects invalid colors for the new fields', () => {
    expect(
      validateConfig(setAt(createDefaults(company), 'header.customBackground', 'not-a-color'), company.id).length,
    ).toBeGreaterThan(0);
    expect(
      validateConfig(setAt(createDefaults(company), 'header.navTextColor', 'red'), company.id).length,
    ).toBeGreaterThan(0);
  });
});

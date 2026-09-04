/**
 * Personal display preferences (theme, layout, item size, language) are
 * per-browser. They must never leak into `configSource`, which is what gets
 * written to the shared conf.yml — otherwise one user's picks silently become
 * everyone's default after the next save to disk.
 *
 * The `storageKey` argument is what distinguishes the two: the quick-pickers
 * pass one, authored edits (custom CSS) do not.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { patchAppConfigField } from '@/utils/config/AppConfigPatch';

/* The global mock in tests/setup.js is a bag of vi.fn()s that stores nothing.
 * These tests care what actually landed in storage, so use a real one. */
const realLocalStorage = global.localStorage;
const makeLocalStorage = () => {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    clear: () => { Object.keys(data).forEach((k) => delete data[k]); },
  };
};

describe('patchAppConfigField', () => {
  let state;

  beforeEach(() => {
    global.localStorage = makeLocalStorage();
    state = {
      config: { appConfig: { theme: 'dashy' } },
      configSource: { appConfig: { theme: 'dashy' } },
    };
  });

  /* Put the shared vi.fn() mock from tests/setup.js back, so suites that run
   * after this one in the same worker still get a mockable localStorage */
  afterEach(() => { global.localStorage = realLocalStorage; });

  describe('a personal preference (storageKey given)', () => {
    it('applies to the rendered config, so the change is visible immediately', () => {
      patchAppConfigField(state, 'theme', 'material-dark', 'theme');
      expect(state.config.appConfig.theme).toBe('material-dark');
    });

    it('persists to localStorage, so it survives a reload in this browser', () => {
      patchAppConfigField(state, 'theme', 'material-dark', 'theme');
      expect(localStorage.getItem('theme')).toBe('material-dark');
    });

    it('leaves configSource untouched, so a save to disk cannot broadcast it', () => {
      patchAppConfigField(state, 'theme', 'material-dark', 'theme');
      expect(state.configSource.appConfig.theme).toBe('dashy');
    });

    it('does not add a key to configSource that was not there before', () => {
      patchAppConfigField(state, 'layout', 'horizontal', 'layoutOrientation');
      expect(state.configSource.appConfig).not.toHaveProperty('layout');
      expect(state.config.appConfig.layout).toBe('horizontal');
    });

    it('is scoped to the key given, so a sub-page override cannot clobber the root', () => {
      patchAppConfigField(state, 'iconSize', 'large', 'iconSize-work');
      expect(localStorage.getItem('iconSize-work')).toBe('large');
      expect(localStorage.getItem('iconSize')).toBeNull();
    });
  });

  describe('an authored edit (no storageKey)', () => {
    it('reaches configSource, so it is written to disk on save', () => {
      patchAppConfigField(state, 'customCss', 'body { color: red; }');
      expect(state.configSource.appConfig.customCss).toBe('body { color: red; }');
    });

    it('also applies to the rendered config', () => {
      patchAppConfigField(state, 'customCss', 'body { color: red; }');
      expect(state.config.appConfig.customCss).toBe('body { color: red; }');
    });

    it('survives a configSource with no appConfig yet', () => {
      state.configSource = {};
      patchAppConfigField(state, 'customCss', 'a{}');
      expect(state.configSource.appConfig.customCss).toBe('a{}');
    });
  });
});

/**
 * Which view (`home` / `minimal` / `workspace`) you land on at `/`.
 * The view a user last picked from the switcher is remembered in their own
 * browser, and takes precedence over the shared `appConfig.startingView`,
 * the same way their theme and layout picks already do.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveStartingView, rememberStartingView } from '@/utils/config/ConfigHelpers';

describe('resolveStartingView', () => {
  it('falls back to home when nothing is stored or configured', () => {
    expect(resolveStartingView(null, undefined)).toBe('home');
  });

  it('uses the configured startingView when the user has not picked one', () => {
    expect(resolveStartingView(null, 'workspace')).toBe('workspace');
  });

  it("prefers the user's own remembered view over the shared config", () => {
    expect(resolveStartingView('minimal', 'workspace')).toBe('minimal');
  });

  it('treats the legacy "default" value as home, from either source', () => {
    expect(resolveStartingView(null, 'default')).toBe('home');
    expect(resolveStartingView('default', 'workspace')).toBe('home');
  });

  it('ignores a stored view that is not a real view, rather than breaking routing', () => {
    expect(resolveStartingView('bogus', 'workspace')).toBe('workspace');
  });

  it('falls back to home when the configured view is not a real view either', () => {
    expect(resolveStartingView('bogus', 'alsoBogus')).toBe('home');
  });

  it('ignores an empty stored value', () => {
    expect(resolveStartingView('', 'minimal')).toBe('minimal');
  });
});

describe('rememberStartingView', () => {
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

  beforeEach(() => { global.localStorage = makeLocalStorage(); });
  afterEach(() => { global.localStorage = realLocalStorage; });

  it('stores the view the user picked', () => {
    rememberStartingView('minimal');
    expect(localStorage.getItem('startingView')).toBe('minimal');
  });

  it('stores nothing for a view that does not exist', () => {
    rememberStartingView('bogus');
    expect(localStorage.getItem('startingView')).toBeNull();
  });

  it('round-trips through resolveStartingView', () => {
    rememberStartingView('workspace');
    expect(resolveStartingView(localStorage.getItem('startingView'), 'home')).toBe('workspace');
  });
});

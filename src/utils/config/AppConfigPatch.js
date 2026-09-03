/**
 * Patch a single appConfig key onto the store's state.
 *
 * `state.config` is what gets rendered; `state.configSource` is what gets
 * written back to conf.yml on disk, and is therefore shared by every user.
 *
 * A `storageKey` marks the change as a personal display preference (theme,
 * layout, item size, language — the quick-pickers). Those are per-browser:
 * they render immediately and persist to localStorage, but must not touch
 * `configSource`, or the next save to disk would push one user's choice out
 * as everybody's default. Authored edits pass no `storageKey` and are saved.
 */
export const patchAppConfigField = (state, key, value, storageKey) => {
  state.config = { ...state.config, appConfig: { ...state.config.appConfig, [key]: value } };
  if (storageKey) {
    localStorage.setItem(storageKey, value);
    return;
  }
  state.configSource = {
    ...state.configSource,
    appConfig: { ...(state.configSource.appConfig || {}), [key]: value },
  };
};

export default patchAppConfigField;

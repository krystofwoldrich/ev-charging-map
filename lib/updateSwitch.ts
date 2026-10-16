// The transaction is independent of Expo so its failure/recovery behavior can be tested.
export interface UpdateSwitchDependencies {
  setOverride: (channel: string | null) => void;
  check: () => Promise<{ isAvailable: boolean; isRollBackToEmbedded?: boolean }>;
  fetch: () => Promise<{ isNew: boolean; isRollBackToEmbedded?: boolean }>;
  persist: (channel: string | null) => Promise<void>;
  dismissSheets: () => Promise<void>;
  reload: () => Promise<void>;
  onProgress?: (message: string) => void;
}

export function validChannel(channel: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(channel);
}

export function updateErrorMessage(error: unknown, channel: string) {
  const message = error instanceof Error ? error.message : '';
  if (/404|no channel named/i.test(message)) {
    return `The channel “${channel}” couldn’t be found. Check its name and try again. Your current version is unchanged.`;
  }
  return 'The new version couldn’t be loaded. Check your connection and try again. Your current version is unchanged.';
}

export async function switchUpdateChannel(channel: string, previous: string | null, deps: UpdateSwitchDependencies) {
  if (!validChannel(channel)) throw new Error('Use letters, numbers, dots, dashes, or underscores (up to 64 characters).');
  let committed = false;
  try {
    deps.onProgress?.('Checking for a compatible version…');
    deps.setOverride(channel);
    const check = await deps.check();
    if (!check.isAvailable && !check.isRollBackToEmbedded) {
      deps.setOverride(previous);
      return 'no-update' as const;
    }
    deps.onProgress?.('Downloading the new version…');
    const fetched = await deps.fetch();
    if (!fetched.isNew && !fetched.isRollBackToEmbedded) throw new Error('The update could not be downloaded. Your current version is unchanged.');
    committed = true;
    await deps.persist(channel);
    deps.onProgress?.('Opening the new version…');
    // Reloading while a native sheet is presented can leave UIKit's modal state stuck.
    await deps.dismissSheets();
    await deps.reload();
    return 'reloading' as const;
  } catch (error) {
    deps.setOverride(previous);
    if (committed) await deps.persist(previous);
    throw error;
  }
}

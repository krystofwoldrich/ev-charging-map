import assert from 'node:assert/strict';
import test from 'node:test';
import { switchUpdateChannel, updateErrorMessage, type UpdateSwitchDependencies } from '../lib/updateSwitch';

function setup(overrides: Partial<UpdateSwitchDependencies> = {}) {
  const events: string[] = [];
  let persisted: string | null = 'production';
  let override: string | null = 'production';
  const deps: UpdateSwitchDependencies = {
    setOverride: channel => { override = channel; events.push(`override:${channel}`); },
    check: async () => { events.push('check'); return { isAvailable: true }; },
    fetch: async () => { events.push('fetch'); return { isNew: true }; },
    persist: async channel => { persisted = channel; events.push(`persist:${channel}`); },
    dismissSheets: async () => { events.push('dismiss'); },
    reload: async () => { events.push('reload'); },
    ...overrides,
  };
  return { deps, events, state: () => ({ persisted, override }) };
}

test('switch downloads, persists, and fully dismisses the native sheet before reloading', async () => {
  const scenario = setup();
  assert.equal(await switchUpdateChannel('preview', 'production', scenario.deps), 'reloading');
  assert.deepEqual(scenario.events, ['override:preview', 'check', 'fetch', 'persist:preview', 'dismiss', 'reload']);
  assert.deepEqual(scenario.state(), { persisted: 'preview', override: 'preview' });
});

test('incompatible/empty channel leaves the running version and channel unchanged', async () => {
  const scenario = setup({ check: async () => ({ isAvailable: false }) });
  assert.equal(await switchUpdateChannel('empty', 'production', scenario.deps), 'no-update');
  assert.deepEqual(scenario.state(), { persisted: 'production', override: 'production' });
  assert.ok(!scenario.events.includes('reload'));
});

test('offline check and failed download restore the previous native header', async () => {
  for (const phase of ['check', 'fetch'] as const) {
    const scenario = setup({ [phase]: async () => { throw new Error('offline'); } });
    await assert.rejects(switchUpdateChannel('preview', 'production', scenario.deps), /offline/);
    assert.deepEqual(scenario.state(), { persisted: 'production', override: 'production' });
    assert.ok(!scenario.events.includes('reload'));
  }
});

test('an empty fetch never persists or reloads', async () => {
  const scenario = setup({ fetch: async () => ({ isNew: false }) });
  await assert.rejects(switchUpdateChannel('preview', 'production', scenario.deps), /could not be downloaded/);
  assert.deepEqual(scenario.state(), { persisted: 'production', override: 'production' });
});

test('reload failure rolls back the saved channel and native override', async () => {
  const scenario = setup({ reload: async () => { throw new Error('reload failed'); } });
  await assert.rejects(switchUpdateChannel('preview', 'production', scenario.deps), /reload failed/);
  assert.deepEqual(scenario.state(), { persisted: 'production', override: 'production' });
});

test('a failed switch from the built-in channel clears the override', async () => {
  const scenario = setup({ check: async () => ({ isAvailable: false }) });
  await switchUpdateChannel('preview', null, scenario.deps);
  assert.equal(scenario.state().override, null);
});

test('server-directed embedded rollback also dismisses before reload', async () => {
  const scenario = setup({ check: async () => ({ isAvailable: false, isRollBackToEmbedded: true }), fetch: async () => ({ isNew: false, isRollBackToEmbedded: true }) });
  assert.equal(await switchUpdateChannel('production', 'preview', scenario.deps), 'reloading');
  assert.deepEqual(scenario.events.slice(-2), ['dismiss', 'reload']);
});

test('invalid channels never reach the update service', async () => {
  const scenario = setup();
  await assert.rejects(switchUpdateChannel('../not a channel', null, scenario.deps), /Use letters/);
  assert.deepEqual(scenario.events, []);
});

test('update failures show useful recovery copy without raw service details', () => {
  const missing = updateErrorMessage(new Error('HTTP 404: no channel named demo for project internal-id'), 'demo');
  assert.match(missing, /channel “demo” couldn’t be found/);
  assert.doesNotMatch(missing, /HTTP|internal-id/);
  assert.match(updateErrorMessage(new Error('Native loader stack trace'), 'preview'), /Check your connection/);
});

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const requireConfig = createRequire(import.meta.url);
const configure = requireConfig('../app.config.js');
const release = requireConfig('../app.json').expo;
const profiles = requireConfig('../eas.json').build;

function configFor(variant?: string) {
  const previous = process.env.APP_VARIANT;
  if (variant === undefined) delete process.env.APP_VARIANT;
  else process.env.APP_VARIANT = variant;
  try {
    return configure({ config: structuredClone(release) });
  } finally {
    if (previous === undefined) delete process.env.APP_VARIANT;
    else process.env.APP_VARIANT = previous;
  }
}

test('default and production preserve the complete release configuration and icon', () => {
  assert.deepEqual(configFor(), release);
  assert.deepEqual(configFor('production'), release);
  assert.equal(release.ios.bundleIdentifier, 'ch.woldri.evchargingmap');
  assert.equal(release.android.package, 'com.krystofwoldrich.evchargingmap');
  const icon = readFileSync(new URL('../assets/images/icon.png', import.meta.url));
  assert.equal(createHash('sha256').update(icon).digest('hex'),
    '627cd902d05303bf2a7afa396395d5791707086ddc4654f84e70a8c5f08cae24');
});

test('development installs independently and cannot claim release links or updates', () => {
  const dev = configFor('development');
  assert.equal(dev.ios.bundleIdentifier, 'ch.woldri.evchargingmap.dev');
  assert.equal(dev.android.package, 'com.krystofwoldrich.evchargingmap.dev');
  assert.equal(dev.ios.infoPlist.CFBundleDisplayName, 'EV Charging Dev');
  assert.equal(dev.scheme, 'evchargingmap-dev');
  assert.notEqual(dev.runtimeVersion, release.runtimeVersion);
  assert.equal(dev.updates.requestHeaders['expo-channel-name'], 'development');
  assert.deepEqual(dev.plugins.at(-1), ['expo-dev-client', { addGeneratedScheme: false }]);
  assert.notEqual(dev.icon, release.icon);
  assert.equal(dev.android.adaptiveIcon.foregroundImage, dev.icon);
  assert.ok(readFileSync(new URL(`../${dev.icon}`, import.meta.url)).length > 0);
  assert.deepEqual(dev.extra.eas, release.extra.eas);
});

test('EAS simulator profiles inherit the intended identity', () => {
  assert.equal(profiles.development.env.APP_VARIANT, 'development');
  assert.equal(profiles['development-simulator'].extends, 'development');
  assert.equal(profiles['development-simulator'].env, undefined);
  assert.equal(profiles.production.env.APP_VARIANT, 'production');
  assert.equal(profiles.simulator.extends, 'production');
  assert.equal(profiles.preview.env.APP_VARIANT, 'production');
});

test('misspelled variants fail instead of accidentally building the release identity', () => {
  assert.throws(() => configFor('developmnt'), /Unknown APP_VARIANT/);
});

import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { deployFree, readProductionConfig } from './deploy-free.mjs'

const projectId = 'ming-jii-free'
const validConfig = {
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_API_KEY: 'public-web-key',
  VITE_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
  VITE_FIREBASE_APP_ID: '1:123:web:456',
  VITE_USE_EMULATORS: 'false',
}

function scenario({ config = validConfig, billing = [{ billingEnabled: false }], failBuild = false } = {}) {
  const events = []
  let billingCalls = 0
  const options = {
    args: ['--project', projectId],
    cwd: '/tmp/test-deployment',
    readConfig: () => config,
    getBilling: async () => {
      events.push('billing-read')
      const value = billing[Math.min(billingCalls++, billing.length - 1)]
      if (value instanceof Error) throw value
      return value
    },
    getCli: () => ({ bin: '/test/firebase-cli.js' }),
    npmCliPath: '/test/npm-cli.js',
    execute: async (command, args, runOptions) => {
      events.push({ command, args, runOptions })
      if (failBuild && args.at(-1) === 'build') throw new Error('Build failed')
    },
    log: () => {},
  }
  return { options, events }
}

test('a paid project never builds or deploys', async () => {
  const { options, events } = scenario({ billing: [{ billingEnabled: true }] })
  await assert.rejects(deployFree(options), /只允许免费 Spark/)
  assert.deepEqual(events, ['billing-read'])
})

test('unknown, inaccessible, or linked billing status prevents all deployment commands', async () => {
  for (const info of [undefined, {}, { billingEnabled: 'false' }, { billingEnabled: false, billingAccountName: 'billingAccounts/linked' }, new Error('Access denied')]) {
    const { options, events } = scenario({ billing: [info] })
    await assert.rejects(deployFree(options))
    assert.deepEqual(events, ['billing-read'])
  }
})

test('target mismatch is rejected before even requesting billing access', async () => {
  const { options, events } = scenario({ config: { ...validConfig, VITE_FIREBASE_PROJECT_ID: 'different-project' } })
  await assert.rejects(deployFree(options), /项目不一致/)
  assert.deepEqual(events, [])
})

test('missing or placeholder web configuration cannot build or publish', async () => {
  for (const apiKey of ['', 'YOUR_API_KEY', '$WEB_KEY']) {
    const { options, events } = scenario({ config: { ...validConfig, VITE_FIREBASE_API_KEY: apiKey } })
    await assert.rejects(deployFree(options), /网页应用配置/)
    assert.deepEqual(events, [])
  }
})

test('an emulator or implicit target cannot publish the website', async () => {
  for (const args of [[], ['--project', 'demo-ming-jii-cloud'], ['--project', projectId, '--force'], ['--project', 'wrong;command']]) {
    const { options, events } = scenario()
    await assert.rejects(deployFree({ ...options, args }))
    assert.deepEqual(events, [])
  }
  const { options, events } = scenario({ config: { ...validConfig, VITE_USE_EMULATORS: 'true' } })
  await assert.rejects(deployFree(options), /不能开启/)
  assert.deepEqual(events, [])
})

test('a successful free deployment builds first, rechecks billing, and targets only Hosting and Firestore', async () => {
  const { options, events } = scenario()
  await deployFree(options)
  assert.equal(events[0], 'billing-read')
  assert.equal(events[1].command, process.execPath)
  assert.deepEqual(events[1].args, ['/test/npm-cli.js', 'run', 'build'])
  assert.equal(events[2], 'billing-read')
  assert.deepEqual(events[3].args, ['/test/firebase-cli.js', 'deploy', '--only', 'hosting,firestore', '--project', projectId, '--non-interactive'])
  assert.equal(events.length, 4)
  assert.equal(events[3].runOptions.env.VITE_FIREBASE_PROJECT_ID, projectId)
})

test('billing changed during a build prevents publishing', async () => {
  const { options, events } = scenario({ billing: [{ billingEnabled: false }, { billingEnabled: true }] })
  await assert.rejects(deployFree(options), /只允许免费 Spark/)
  assert.equal(events.length, 3)
  assert.equal(events[2], 'billing-read')
})

test('a failed build prevents the second billing request and deployment', async () => {
  const { options, events } = scenario({ failBuild: true })
  await assert.rejects(deployFree(options), /Build failed/)
  assert.equal(events.length, 2)
})

test('production env precedence matches the config used for a deploy and ignores unrelated secrets', () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), 'ming-jii-deploy-'))
  try {
    writeFileSync(path.join(cwd, '.env'), 'VITE_FIREBASE_PROJECT_ID=base-project\nPRIVATE_TOKEN=ignored\n')
    writeFileSync(path.join(cwd, '.env.local'), 'VITE_FIREBASE_PROJECT_ID=local-project\n')
    writeFileSync(path.join(cwd, '.env.production'), 'VITE_FIREBASE_PROJECT_ID=production-project\n')
    writeFileSync(path.join(cwd, '.env.production.local'), 'VITE_FIREBASE_PROJECT_ID=final-project\n')
    assert.equal(readProductionConfig(cwd, {}).VITE_FIREBASE_PROJECT_ID, 'final-project')
    assert.equal(readProductionConfig(cwd, { VITE_FIREBASE_PROJECT_ID: 'shell-project' }).VITE_FIREBASE_PROJECT_ID, 'shell-project')
    assert.equal(Object.hasOwn(readProductionConfig(cwd, { PRIVATE_TOKEN: 'ignored' }), 'PRIVATE_TOKEN'), false)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

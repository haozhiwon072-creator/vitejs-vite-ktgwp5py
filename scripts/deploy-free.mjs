import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseEnv } from 'node:util'

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicConfigKeys = [
  'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_APP_ID', 'VITE_USE_EMULATORS',
]

export function readProductionConfig(cwd, environment = process.env) {
  const result = {}
  // Match Vite's production file precedence; the process environment wins.
  for (const filename of ['.env', '.env.local', '.env.production', '.env.production.local']) {
    let parsed
    try {
      parsed = parseEnv(readFileSync(path.join(cwd, filename), 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') continue
      throw new Error(`无法读取 ${filename}，部署已停止。`)
    }
    for (const key of publicConfigKeys) {
      if (Object.hasOwn(parsed, key)) result[key] = parsed[key]
    }
  }
  for (const key of publicConfigKeys) {
    if (Object.hasOwn(environment, key)) result[key] = environment[key]
  }
  return result
}

export function parseProject(args) {
  if (args.length !== 2 || args[0] !== '--project') {
    throw new Error('请明确指定项目：npm run deploy:free -- --project YOUR_PROJECT_ID')
  }
  const projectId = args[1]
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) || projectId.startsWith('demo-')) {
    throw new Error('需要真实的 Firebase 项目 ID，不能使用模拟器 demo 项目。')
  }
  return projectId
}

export function assertFreeBilling(info) {
  if (!info || info.billingEnabled !== false || info.billingAccountName) {
    throw new Error('未能确认此项目没有绑定账单账户。只允许免费 Spark 项目，部署已停止。')
  }
}

function installedCli() {
  const packagePath = require.resolve('firebase-tools/package.json')
  const { version } = require(packagePath)
  if (version !== '15.32.1') {
    throw new Error('请使用项目锁定的 firebase-tools 15.32.1，先运行 npm ci。')
  }
  return {
    root: path.dirname(packagePath),
    bin: path.join(path.dirname(packagePath), 'lib/bin/firebase.js'),
  }
}

async function readBilling(projectId, cwd) {
  const cli = installedCli()
  const auth = require(path.join(cli.root, 'lib/auth.js'))
  const { requireAuth } = require(path.join(cli.root, 'lib/requireAuth.js'))
  const { Client } = require(path.join(cli.root, 'lib/apiv2.js'))
  const options = { project: projectId, projectRoot: cwd, nonInteractive: true }
  // Reuse CLI-selected authentication through its helpers; never handle credential files.
  const account = auth.getProjectDefaultAccount(cwd)
  if (account) auth.setActiveAccount(options, account)
  await requireAuth(options)
  const client = new Client({ urlPrefix: 'https://cloudbilling.googleapis.com', apiVersion: 'v1' })
  // Read only. Do not use cloudbilling.checkBillingEnabled: it may enable an API.
  const response = await client.get(`/projects/${projectId}/billingInfo`)
  return response.body
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit', shell: false })
    child.once('error', () => reject(new Error('无法启动命令，请先完成依赖安装。')))
    child.once('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`命令未成功完成（${signal || code}），部署已停止。`))
    })
  })
}

export async function deployFree({
  args = process.argv.slice(2),
  cwd = repoRoot,
  readConfig = readProductionConfig,
  getBilling = readBilling,
  execute = runCommand,
  getCli = installedCli,
  npmCliPath = process.env.npm_execpath,
  log = console.log,
} = {}) {
  const projectId = parseProject(args)
  const config = readConfig(cwd)
  if (config.VITE_FIREBASE_PROJECT_ID !== projectId) {
    throw new Error('VITE_FIREBASE_PROJECT_ID 与部署项目不一致，部署已停止。')
  }
  const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_APP_ID']
  if (required.some(key => !config[key] || config[key].includes('$') || config[key].includes('YOUR_'))) {
    throw new Error('请先填写 .env.local 中的 Firebase 网页应用配置，使用直接填写的值。')
  }
  if (config.VITE_USE_EMULATORS === 'true') {
    throw new Error('生产部署不能开启 VITE_USE_EMULATORS，请将其设为 false。')
  }
  async function checkBilling() {
    let info
    try {
      info = await getBilling(projectId, cwd)
    } catch {
      throw new Error('无法读取项目的账单状态。请先登录 Firebase 并确认查看账单状态的权限；未确认免费状态前不会部署。')
    }
    assertFreeBilling(info)
  }
  await checkBilling()
  const cli = getCli()
  log('已确认项目没有绑定账单账户。正在构建网站。')
  const options = { cwd, env: { ...process.env, ...config } }
  // npm supplies its JS entry point to scripts; execute it directly for Windows support.
  if (npmCliPath) {
    await execute(process.execPath, [npmCliPath, 'run', 'build'], options)
  } else if (process.platform !== 'win32') {
    await execute('npm', ['run', 'build'], options)
  } else {
    throw new Error('请通过 npm run deploy:free 执行部署。')
  }
  // Recheck after the build so a changed billing status cannot pass an old observation.
  await checkBilling()
  await execute(process.execPath, [cli.bin, 'deploy', '--only', 'hosting,firestore', '--project', projectId, '--non-interactive'], options)
  log('免费项目部署完成。请使用 Firebase CLI 显示的 Hosting 网址。')
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  deployFree().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}

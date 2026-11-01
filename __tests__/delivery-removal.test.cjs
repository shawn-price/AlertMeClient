const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function createStore(initialData) {
  const records = new Map(Object.entries(initialData))
  const storage = {
    loadSync: (key, fallback) => records.has(key) ? records.get(key) : fallback,
    saveSync: (key, value) => records.set(key, value),
    initIndexedDB: async () => {},
    requestPersistentStorage: async () => false,
    load: async (_key, fallback) => fallback,
  }
  const module = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync('lib/data-store.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const context = {
    module, exports: module.exports,
    require: (name) => {
      if (name === './storage-manager') return { StorageManager: storage }
      if (name === '@/lib/form-utils') return { formatCurrency: String }
      throw new Error(`Unexpected dependency: ${name}`)
    },
    window: { addEventListener() {} }, console, setTimeout, clearTimeout,
    fetch: () => { throw new Error('Transactions must not send network requests') },
  }
  vm.runInNewContext(source, context, { filename: 'data-store.js' })
  return { store: module.exports.dataStore, records }
}

function legacyState(name) {
  return {
    version: 1,
    userData: { name, balance: 1000, phone: '08012345678' },
    transactions: [], beneficiaries: [], notifications: [], loanApplications: [],
    settings: { theme: 'dark', notifications: false, smsAlerts: true, biometricLogin: true, language: 'en' },
    smsGatewayConfigs: [{ name: 'legacy', credentials: { apiKey: 'secret' } }],
  }
}

function assertClean(state, name) {
  assert.equal(state.userData.name, name)
  assert.equal(state.settings.theme, 'dark')
  assert.equal(state.settings.biometricLogin, true)
  assert.equal('smsGatewayConfigs' in state, false)
  assert.equal('smsAlerts' in state.settings, false)
}

test('stored data and existing backup are cleaned without replacing the backup', async () => {
  const { store, records } = createStore({
    ecobank_app_data: legacyState('current'),
    ecobank_app_backup: { version: 1, data: legacyState('backup') },
  })
  assertClean(records.get('ecobank_app_data'), 'current')
  assertClean(records.get('ecobank_app_backup').data, 'backup')
  assert.equal(await store.restoreFromBackup(), true)
  assertClean(JSON.parse(store.exportData()).data, 'backup')
})

test('legacy imports are cleaned and transactions retain in-app notifications without sending', async () => {
  const { store } = createStore({})
  assert.equal(await store.importData(JSON.stringify({ version: 1, data: legacyState('imported') })), true)
  assertClean(JSON.parse(store.exportData()).data, 'imported')
  await store.addTransaction({ type: 'Transfer', amount: 100, recipient: 'Test', description: 'Test', status: 'Successful', isDebit: true, section: 'Today', fee: 10 })
  assert.equal(store.getUserData().balance, 890)
  assert.equal(store.getNotifications()[0].title, 'Money Sent')
})

test('removed API routes are not present', () => {
  assert.equal(fs.existsSync('app/api/sms'), false)
  assert.equal(fs.existsSync('app/api/settings/vartech-config'), false)
})

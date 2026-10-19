const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../utils/adminAuthenticate.js'), 'utf8');
const roles = ['super_admin', 'admin', 'manager', 'support'];

async function authorize(record, tokenRole = record?.role, permission = 'bookings') {
  const context = { module: { exports: {} }, require(name) {
    if (name === './jwtUtils') return { decodeToken: () => ({ userId: 7, userType: 'admin', role: tokenRole }) };
    if (name === './logger') return { error() {} };
    if (name === './errorHandlers/appError') return class extends Error {
      constructor(message, statusCode) { super(message); this.statusCode = statusCode; }
    };
    if (name === '../api/adminUsers/models/adminUser.model') return { findByPk: async () => record };
    throw new Error(`Unexpected dependency: ${name}`);
  } };
  vm.runInNewContext(source, context);
  const req = { get: () => 'Bearer test' };
  let error;
  let calls = 0;
  await context.module.exports(roles, permission)(req, {}, err => { error = err; calls++; });
  assert.equal(calls, 1);
  return { req, error };
}

test('existing booking roles retain module access with default permissions', async () => {
  for (const role of roles) {
    const { error } = await authorize({ role, status: 'active', customPermissions: [] });
    assert.equal(error, undefined, role);
  }
});

test('custom Bookings grant allows an analyst and preserves zone restrictions', async () => {
  const { error, req } = await authorize({ role: 'analyst', status: 'active', customPermissions: ['bookings'], allowedZones: [2] });
  assert.equal(error, undefined);
  assert.deepEqual(Array.from(req.admin.allowedZones), [2]);
});

test('a custom permission set without Bookings denies module access', async () => {
  const { error } = await authorize({ role: 'admin', status: 'active', customPermissions: ['reports'] });
  assert.equal(error.statusCode, 403);
});

test('analysts without a custom Bookings grant cannot access the module', async () => {
  const { error } = await authorize({ role: 'analyst', status: 'active', customPermissions: [] });
  assert.equal(error.statusCode, 403);
});

test('saved role is used when a token contains an older role', async () => {
  const { error } = await authorize({ role: 'analyst', status: 'active', customPermissions: [] }, 'admin');
  assert.equal(error.statusCode, 403);
});

test('super admins retain access with custom permissions', async () => {
  const { error } = await authorize({ role: 'super_admin', status: 'active', customPermissions: ['reports'] });
  assert.equal(error, undefined);
});

test('missing and inactive accounts cannot create bookings', async () => {
  for (const record of [null, { role: 'admin', status: 'inactive', customPermissions: ['bookings'] }]) {
    const { error } = await authorize(record, 'admin');
    assert.equal(error.statusCode, 403);
  }
});

test('routes without a module permission keep their existing role restriction', async () => {
  const { error } = await authorize({ role: 'analyst', status: 'active', customPermissions: ['bookings'] }, 'analyst', null);
  assert.equal(error.statusCode, 403);
});

test('viewing bookings alone does not allow creation for any staff role', async () => {
  for (const role of ['admin', 'manager', 'support', 'analyst']) {
    for (const customPermissions of [[], ['bookings']]) {
      const { error } = await authorize({ role, status: 'active', customPermissions }, role, 'bookings_create');
      assert.equal(error.statusCode, 403, role);
    }
  }
});

test('explicit view and creation grants allow every staff role to create', async () => {
  for (const role of ['admin', 'manager', 'support', 'analyst']) {
    const { error } = await authorize({ role, status: 'active', customPermissions: ['bookings', 'bookings_create'] }, role, 'bookings_create');
    assert.equal(error, undefined, role);
  }
});

test('creation grant without Bookings access is rejected', async () => {
  const { error } = await authorize({ role: 'analyst', status: 'active', customPermissions: ['bookings_create'] }, 'analyst', 'bookings_create');
  assert.equal(error.statusCode, 403);
});

test('Super Admin can create bookings without an additional grant', async () => {
  const { error } = await authorize({ role: 'super_admin', status: 'active', customPermissions: [] }, 'super_admin', 'bookings_create');
  assert.equal(error, undefined);
});

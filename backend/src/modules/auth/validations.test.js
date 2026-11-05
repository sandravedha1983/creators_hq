'use strict';

const { registerSchema } = require('./validations');

describe('registerSchema role authorization', () => {
  const base = {
    name: 'Test User',
    email: 'test@example.invalid',
    password: 'password123'
  };

  test.each(['creator', 'brand'])('accepts public signup role %s', (role) => {
    expect(registerSchema.parse({ ...base, role }).role).toBe(role);
  });

  test('rejects admin as a client-selected signup role', () => {
    expect(registerSchema.safeParse({ ...base, role: 'admin' }).success).toBe(false);
  });
});

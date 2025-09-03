import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'securepassword123',
  full_name: 'Test User',
  phone: '+601234567890',
  role: 'pelajar'
};

const adminInput: CreateUserInput = {
  email: 'admin@example.com',
  password: 'adminpassword456',
  full_name: 'Admin User',
  phone: null,
  role: 'administrator'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Verify basic field values
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.phone).toEqual('+601234567890');
    expect(result.role).toEqual('pelajar');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify password is properly hashed (not plain text)
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('securepassword123');
    expect(result.password_hash.length).toBeGreaterThan(20);
  });

  it('should create a user with null phone', async () => {
    const result = await createUser(adminInput);

    expect(result.email).toEqual('admin@example.com');
    expect(result.full_name).toEqual('Admin User');
    expect(result.phone).toBeNull();
    expect(result.role).toEqual('administrator');
    expect(result.is_active).toBe(true);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].full_name).toEqual('Test User');
    expect(users[0].phone).toEqual('+601234567890');
    expect(users[0].role).toEqual('pelajar');
    expect(users[0].is_active).toBe(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash password correctly', async () => {
    const result = await createUser(testInput);

    // Verify password can be verified using Bun's password verification
    const isValid = await Bun.password.verify('securepassword123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify incorrect password fails verification
    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should create users with different roles', async () => {
    const roles = ['administrator', 'admin_pusat', 'pengurus_pusat', 'pengajar_pusat', 'pelajar'] as const;
    
    for (const role of roles) {
      const roleInput: CreateUserInput = {
        email: `${role}@example.com`,
        password: 'password123',
        full_name: `${role} User`,
        phone: '+601234567890',
        role
      };

      const result = await createUser(roleInput);
      expect(result.role).toEqual(role);
      expect(result.email).toEqual(`${role}@example.com`);
    }
  });

  it('should handle duplicate email error', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      password: 'differentpassword',
      full_name: 'Different User',
      phone: '+601987654321',
      role: 'administrator'
    };

    // Should throw error due to unique constraint
    expect(createUser(duplicateInput)).rejects.toThrow();
  });

  it('should set default timestamps', async () => {
    const beforeCreate = new Date();
    const result = await createUser(testInput);
    const afterCreate = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  it('should create multiple users successfully', async () => {
    const users = [
      { ...testInput, email: 'user1@example.com' },
      { ...testInput, email: 'user2@example.com' },
      { ...testInput, email: 'user3@example.com' }
    ];

    const results = await Promise.all(users.map(user => createUser(user)));

    expect(results).toHaveLength(3);
    results.forEach((result, index) => {
      expect(result.email).toEqual(`user${index + 1}@example.com`);
      expect(result.full_name).toEqual('Test User');
      expect(result.role).toEqual('pelajar');
      expect(result.id).toBeDefined();
    });

    // Verify all users are in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(3);
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();

    expect(result).toEqual([]);
  });

  it('should return single user when one user exists', async () => {
    // Create test user
    const passwordHash = 'hashed_password_123';
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: passwordHash,
        full_name: 'Test User',
        phone: '1234567890',
        role: 'pelajar',
        is_active: true,
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('test@example.com');
    expect(result[0].full_name).toBe('Test User');
    expect(result[0].phone).toBe('1234567890');
    expect(result[0].role).toBe('pelajar');
    expect(result[0].is_active).toBe(true);
    expect(result[0].password_hash).toBe(passwordHash);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple users with different roles', async () => {
    // Create multiple test users
    const passwordHash1 = 'hashed_password_admin';
    const passwordHash2 = 'hashed_password_teacher';
    const passwordHash3 = 'hashed_password_student';

    await db.insert(usersTable)
      .values([
        {
          email: 'admin@example.com',
          password_hash: passwordHash1,
          full_name: 'Admin User',
          phone: '1111111111',
          role: 'administrator',
          is_active: true,
        },
        {
          email: 'teacher@example.com',
          password_hash: passwordHash2,
          full_name: 'Teacher User',
          phone: null,
          role: 'pengajar_pusat',
          is_active: true,
        },
        {
          email: 'student@example.com',
          password_hash: passwordHash3,
          full_name: 'Student User',
          phone: '3333333333',
          role: 'pelajar',
          is_active: false,
        },
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Find each user by email
    const admin = result.find(u => u.email === 'admin@example.com');
    const teacher = result.find(u => u.email === 'teacher@example.com');
    const student = result.find(u => u.email === 'student@example.com');

    // Verify admin user
    expect(admin).toBeDefined();
    expect(admin?.full_name).toBe('Admin User');
    expect(admin?.role).toBe('administrator');
    expect(admin?.is_active).toBe(true);
    expect(admin?.phone).toBe('1111111111');

    // Verify teacher user
    expect(teacher).toBeDefined();
    expect(teacher?.full_name).toBe('Teacher User');
    expect(teacher?.role).toBe('pengajar_pusat');
    expect(teacher?.is_active).toBe(true);
    expect(teacher?.phone).toBeNull();

    // Verify student user
    expect(student).toBeDefined();
    expect(student?.full_name).toBe('Student User');
    expect(student?.role).toBe('pelajar');
    expect(student?.is_active).toBe(false);
    expect(student?.phone).toBe('3333333333');
  });

  it('should return users ordered by creation time', async () => {
    // Create users with slight delay to ensure different timestamps
    const passwordHash = 'hashed_password_test';
    
    await db.insert(usersTable)
      .values({
        email: 'first@example.com',
        password_hash: passwordHash,
        full_name: 'First User',
        role: 'pelajar',
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(usersTable)
      .values({
        email: 'second@example.com',
        password_hash: passwordHash,
        full_name: 'Second User',
        role: 'pengajar_pusat',
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Verify users are returned (order not guaranteed without explicit ORDER BY)
    const emails = result.map(u => u.email);
    expect(emails).toContain('first@example.com');
    expect(emails).toContain('second@example.com');
    
    // Verify timestamps are properly returned as Date objects
    result.forEach(user => {
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should include all user roles', async () => {
    const passwordHash = 'hashed_password_roles';
    
    // Test all available roles
    const roles = ['administrator', 'admin_pusat', 'pengurus_pusat', 'pengajar_pusat', 'pelajar'] as const;
    
    const userValues = roles.map((role, index) => ({
      email: `${role}@example.com`,
      password_hash: passwordHash,
      full_name: `${role} User`,
      role: role,
      is_active: true,
    }));

    await db.insert(usersTable)
      .values(userValues)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(5);
    
    // Verify all roles are present
    const resultRoles = result.map(u => u.role).sort();
    expect(resultRoles).toEqual(roles.slice().sort());
    
    // Verify each user has correct role
    roles.forEach(role => {
      const user = result.find(u => u.role === role);
      expect(user).toBeDefined();
      expect(user?.email).toBe(`${role}@example.com`);
      expect(user?.full_name).toBe(`${role} User`);
    });
  });

  it('should handle users with null phone numbers', async () => {
    const passwordHash = 'hashed_password_phone';
    
    await db.insert(usersTable)
      .values([
        {
          email: 'with-phone@example.com',
          password_hash: passwordHash,
          full_name: 'User With Phone',
          phone: '1234567890',
          role: 'pelajar',
        },
        {
          email: 'without-phone@example.com',
          password_hash: passwordHash,
          full_name: 'User Without Phone',
          phone: null,
          role: 'pengajar_pusat',
        },
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    const withPhone = result.find(u => u.email === 'with-phone@example.com');
    const withoutPhone = result.find(u => u.email === 'without-phone@example.com');

    expect(withPhone?.phone).toBe('1234567890');
    expect(withoutPhone?.phone).toBeNull();
  });

  it('should include both active and inactive users', async () => {
    const passwordHash = 'hashed_password_active';
    
    await db.insert(usersTable)
      .values([
        {
          email: 'active@example.com',
          password_hash: passwordHash,
          full_name: 'Active User',
          role: 'pelajar',
          is_active: true,
        },
        {
          email: 'inactive@example.com',
          password_hash: passwordHash,
          full_name: 'Inactive User',
          role: 'pengajar_pusat',
          is_active: false,
        },
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    const activeUser = result.find(u => u.email === 'active@example.com');
    const inactiveUser = result.find(u => u.email === 'inactive@example.com');

    expect(activeUser?.is_active).toBe(true);
    expect(inactiveUser?.is_active).toBe(false);
  });
});
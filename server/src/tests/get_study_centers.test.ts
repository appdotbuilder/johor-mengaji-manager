import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable } from '../db/schema';
import { getStudyCenters } from '../handlers/get_study_centers';

describe('getStudyCenters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no study centers exist', async () => {
    const result = await getStudyCenters();
    expect(result).toEqual([]);
  });

  it('should fetch active study centers', async () => {
    // Create admin user first
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        phone: '123456789',
        role: 'administrator',
        is_active: true,
      })
      .returning()
      .execute();

    // Create active study center
    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        phone: '987654321',
        email: 'center@test.com',
        registration_number: 'REG123',
        admin_id: adminUser[0].id,
        is_active: true,
      })
      .returning()
      .execute();

    const result = await getStudyCenters();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Study Center');
    expect(result[0].address).toBe('123 Test Street');
    expect(result[0].phone).toBe('987654321');
    expect(result[0].email).toBe('center@test.com');
    expect(result[0].registration_number).toBe('REG123');
    expect(result[0].admin_id).toBe(adminUser[0].id);
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should only return active study centers', async () => {
    // Create admin user first
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        phone: '123456789',
        role: 'administrator',
        is_active: true,
      })
      .returning()
      .execute();

    // Create active study center
    await db.insert(studyCentersTable)
      .values({
        name: 'Active Study Center',
        address: '123 Active Street',
        phone: '111111111',
        email: 'active@test.com',
        registration_number: 'ACTIVE123',
        admin_id: adminUser[0].id,
        is_active: true,
      })
      .execute();

    // Create inactive study center
    await db.insert(studyCentersTable)
      .values({
        name: 'Inactive Study Center',
        address: '456 Inactive Street',
        phone: '222222222',
        email: 'inactive@test.com',
        registration_number: 'INACTIVE456',
        admin_id: adminUser[0].id,
        is_active: false,
      })
      .execute();

    const result = await getStudyCenters();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Active Study Center');
    expect(result[0].is_active).toBe(true);
  });

  it('should fetch multiple active study centers', async () => {
    // Create admin users first
    const adminUser1 = await db.insert(usersTable)
      .values({
        email: 'admin1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User 1',
        phone: '123456789',
        role: 'administrator',
        is_active: true,
      })
      .returning()
      .execute();

    const adminUser2 = await db.insert(usersTable)
      .values({
        email: 'admin2@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User 2',
        phone: '987654321',
        role: 'admin_pusat',
        is_active: true,
      })
      .returning()
      .execute();

    // Create multiple study centers
    await db.insert(studyCentersTable)
      .values([
        {
          name: 'Study Center A',
          address: '123 Street A',
          phone: '111111111',
          email: 'centera@test.com',
          registration_number: 'REGA123',
          admin_id: adminUser1[0].id,
          is_active: true,
        },
        {
          name: 'Study Center B',
          address: '456 Street B',
          phone: '222222222',
          email: 'centerb@test.com',
          registration_number: 'REGB456',
          admin_id: adminUser2[0].id,
          is_active: true,
        },
        {
          name: 'Study Center C',
          address: '789 Street C',
          phone: null, // Test nullable fields
          email: null, // Test nullable fields
          registration_number: null, // Test nullable fields
          admin_id: adminUser1[0].id,
          is_active: true,
        }
      ])
      .execute();

    const result = await getStudyCenters();

    expect(result).toHaveLength(3);
    
    // Verify all study centers are returned
    const names = result.map(center => center.name).sort();
    expect(names).toEqual(['Study Center A', 'Study Center B', 'Study Center C']);
    
    // Verify nullable fields are handled correctly
    const centerC = result.find(center => center.name === 'Study Center C');
    expect(centerC?.phone).toBeNull();
    expect(centerC?.email).toBeNull();
    expect(centerC?.registration_number).toBeNull();
  });

  it('should handle study centers with all nullable fields as null', async () => {
    // Create admin user first
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        phone: '123456789',
        role: 'administrator',
        is_active: true,
      })
      .returning()
      .execute();

    // Create study center with minimal required fields
    await db.insert(studyCentersTable)
      .values({
        name: 'Minimal Study Center',
        address: 'Basic Address',
        phone: null,
        email: null,
        registration_number: null,
        admin_id: adminUser[0].id,
        is_active: true,
      })
      .execute();

    const result = await getStudyCenters();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Minimal Study Center');
    expect(result[0].address).toBe('Basic Address');
    expect(result[0].phone).toBeNull();
    expect(result[0].email).toBeNull();
    expect(result[0].registration_number).toBeNull();
    expect(result[0].admin_id).toBe(adminUser[0].id);
    expect(result[0].is_active).toBe(true);
  });
});
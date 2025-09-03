import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studyCentersTable, usersTable } from '../db/schema';
import { type CreateStudyCenterInput } from '../schema';
import { createStudyCenter } from '../handlers/create_study_center';
import { eq } from 'drizzle-orm';

describe('createStudyCenter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let adminUserId: number;

  beforeEach(async () => {
    // Create admin user for testing
    const adminResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        phone: '+1234567890',
        role: 'administrator',
        is_active: true
      })
      .returning()
      .execute();
    
    adminUserId = adminResult[0].id;
  });

  const testInput: CreateStudyCenterInput = {
    name: 'Test Study Center',
    address: '123 Main St, Test City',
    phone: '+1987654321',
    email: 'center@test.com',
    registration_number: 'SC001',
    admin_id: 0 // Will be set to adminUserId in tests
  };

  it('should create a study center with all fields', async () => {
    const input = { ...testInput, admin_id: adminUserId };
    const result = await createStudyCenter(input);

    // Basic field validation
    expect(result.name).toEqual('Test Study Center');
    expect(result.address).toEqual('123 Main St, Test City');
    expect(result.phone).toEqual('+1987654321');
    expect(result.email).toEqual('center@test.com');
    expect(result.registration_number).toEqual('SC001');
    expect(result.admin_id).toEqual(adminUserId);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a study center with minimal fields (nullable fields as null)', async () => {
    const minimalInput: CreateStudyCenterInput = {
      name: 'Minimal Study Center',
      address: '456 Test Ave',
      phone: null,
      email: null,
      registration_number: null,
      admin_id: adminUserId
    };

    const result = await createStudyCenter(minimalInput);

    expect(result.name).toEqual('Minimal Study Center');
    expect(result.address).toEqual('456 Test Ave');
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.registration_number).toBeNull();
    expect(result.admin_id).toEqual(adminUserId);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save study center to database', async () => {
    const input = { ...testInput, admin_id: adminUserId };
    const result = await createStudyCenter(input);

    // Query using proper drizzle syntax
    const studyCenters = await db.select()
      .from(studyCentersTable)
      .where(eq(studyCentersTable.id, result.id))
      .execute();

    expect(studyCenters).toHaveLength(1);
    expect(studyCenters[0].name).toEqual('Test Study Center');
    expect(studyCenters[0].address).toEqual('123 Main St, Test City');
    expect(studyCenters[0].phone).toEqual('+1987654321');
    expect(studyCenters[0].email).toEqual('center@test.com');
    expect(studyCenters[0].registration_number).toEqual('SC001');
    expect(studyCenters[0].admin_id).toEqual(adminUserId);
    expect(studyCenters[0].is_active).toEqual(true);
    expect(studyCenters[0].created_at).toBeInstanceOf(Date);
    expect(studyCenters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when admin user does not exist', async () => {
    const input = { ...testInput, admin_id: 999999 }; // Non-existent admin ID

    await expect(createStudyCenter(input)).rejects.toThrow(/Admin user with id 999999 not found/i);
  });

  it('should validate admin user exists before creating study center', async () => {
    const input = { ...testInput, admin_id: adminUserId };
    
    // First create should succeed
    const result1 = await createStudyCenter(input);
    expect(result1.admin_id).toEqual(adminUserId);

    // Create another admin user
    const admin2Result = await db.insert(usersTable)
      .values({
        email: 'admin2@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User 2',
        phone: '+1234567891',
        role: 'admin_pusat',
        is_active: true
      })
      .returning()
      .execute();
    
    const admin2Id = admin2Result[0].id;

    // Second create with different admin should also succeed
    const input2 = {
      ...testInput,
      name: 'Second Study Center',
      admin_id: admin2Id
    };
    const result2 = await createStudyCenter(input2);
    expect(result2.admin_id).toEqual(admin2Id);
    expect(result2.name).toEqual('Second Study Center');
  });

  it('should create multiple study centers with different admins', async () => {
    // Create second admin
    const admin2Result = await db.insert(usersTable)
      .values({
        email: 'admin2@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User 2',
        role: 'admin_pusat',
        is_active: true
      })
      .returning()
      .execute();

    const admin2Id = admin2Result[0].id;

    // Create first study center
    const input1 = { ...testInput, admin_id: adminUserId };
    const result1 = await createStudyCenter(input1);

    // Create second study center with different admin
    const input2 = {
      ...testInput,
      name: 'Second Study Center',
      email: 'center2@test.com',
      admin_id: admin2Id
    };
    const result2 = await createStudyCenter(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.admin_id).toEqual(adminUserId);
    expect(result2.admin_id).toEqual(admin2Id);

    // Verify both are in database
    const allCenters = await db.select().from(studyCentersTable).execute();
    expect(allCenters).toHaveLength(2);
  });
});
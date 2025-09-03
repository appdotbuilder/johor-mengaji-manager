import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, teachersTable } from '../db/schema';
import { type CreateTeacherInput } from '../schema';
import { createTeacher } from '../handlers/create_teacher';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'teacher@example.com',
  password_hash: 'hashedpassword',
  full_name: 'Test Teacher',
  phone: '0123456789',
  role: 'pengajar_pusat' as const,
  is_active: true
};

const testAdmin = {
  email: 'admin@example.com',
  password_hash: 'hashedpassword',
  full_name: 'Admin User',
  phone: '0123456788',
  role: 'admin_pusat' as const,
  is_active: true
};

const testStudyCenter = {
  name: 'Test Study Center',
  address: '123 Test Street, Test City',
  phone: '0123456787',
  email: 'center@example.com',
  registration_number: 'REG123',
  admin_id: 0, // Will be set after admin creation
  is_active: true
};

const testInput: CreateTeacherInput = {
  user_id: 0, // Will be set after user creation
  study_center_id: 0, // Will be set after study center creation
  ic_number: '123456-78-9012',
  date_of_birth: new Date('1990-01-01'),
  address: '456 Teacher Street, Teacher City',
  qualifications: 'Bachelor in Islamic Studies',
  jaij_permit_number: 'JAIJ123',
  jaij_permit_expiry: new Date('2025-12-31')
};

describe('createTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a teacher successfully', async () => {
    // Create admin user first
    const adminResult = await db.insert(usersTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminResult[0].id
      })
      .returning()
      .execute();

    // Create teacher user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create teacher input with real IDs
    const input = {
      ...testInput,
      user_id: userResult[0].id,
      study_center_id: studyCenterResult[0].id
    };

    const result = await createTeacher(input);

    // Validate returned teacher
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.study_center_id).toEqual(studyCenterResult[0].id);
    expect(result.ic_number).toEqual('123456-78-9012');
    expect(result.date_of_birth).toEqual(new Date('1990-01-01'));
    expect(result.address).toEqual('456 Teacher Street, Teacher City');
    expect(result.qualifications).toEqual('Bachelor in Islamic Studies');
    expect(result.jaij_permit_number).toEqual('JAIJ123');
    expect(result.jaij_permit_expiry).toEqual(new Date('2025-12-31'));
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save teacher to database', async () => {
    // Create admin user first
    const adminResult = await db.insert(usersTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminResult[0].id
      })
      .returning()
      .execute();

    // Create teacher user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create teacher input with real IDs
    const input = {
      ...testInput,
      user_id: userResult[0].id,
      study_center_id: studyCenterResult[0].id
    };

    const result = await createTeacher(input);

    // Query database to verify teacher was saved
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, result.id))
      .execute();

    expect(teachers).toHaveLength(1);
    expect(teachers[0].user_id).toEqual(userResult[0].id);
    expect(teachers[0].study_center_id).toEqual(studyCenterResult[0].id);
    expect(teachers[0].ic_number).toEqual('123456-78-9012');
    expect(teachers[0].date_of_birth).toEqual('1990-01-01'); // Date stored as string in DB
    expect(teachers[0].address).toEqual('456 Teacher Street, Teacher City');
    expect(teachers[0].qualifications).toEqual('Bachelor in Islamic Studies');
    expect(teachers[0].jaij_permit_number).toEqual('JAIJ123');
    expect(teachers[0].jaij_permit_expiry).toEqual('2025-12-31'); // Date stored as string in DB
    expect(teachers[0].is_active).toBe(true);
  });

  it('should create teacher with optional fields as null', async () => {
    // Create admin user first
    const adminResult = await db.insert(usersTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminResult[0].id
      })
      .returning()
      .execute();

    // Create teacher user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create teacher input without optional fields
    const input = {
      user_id: userResult[0].id,
      study_center_id: studyCenterResult[0].id,
      ic_number: '987654-32-1098',
      date_of_birth: new Date('1985-05-15'),
      address: '789 Basic Teacher Street',
      qualifications: null,
      jaij_permit_number: null,
      jaij_permit_expiry: null
    };

    const result = await createTeacher(input);

    expect(result.qualifications).toBeNull();
    expect(result.jaij_permit_number).toBeNull();
    expect(result.jaij_permit_expiry).toBeNull();
    expect(result.ic_number).toEqual('987654-32-1098');
    expect(result.is_active).toBe(true);
  });

  it('should throw error when user does not exist', async () => {
    // Create admin user first
    const adminResult = await db.insert(usersTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminResult[0].id
      })
      .returning()
      .execute();

    // Create teacher input with non-existent user_id
    const input = {
      ...testInput,
      user_id: 99999, // Non-existent user ID
      study_center_id: studyCenterResult[0].id
    };

    await expect(createTeacher(input)).rejects.toThrow(/User with id 99999 does not exist/i);
  });

  it('should throw error when study center does not exist', async () => {
    // Create teacher user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create teacher input with non-existent study_center_id
    const input = {
      ...testInput,
      user_id: userResult[0].id,
      study_center_id: 99999 // Non-existent study center ID
    };

    await expect(createTeacher(input)).rejects.toThrow(/Study center with id 99999 does not exist/i);
  });

  it('should throw error when IC number already exists', async () => {
    // Create admin user first
    const adminResult = await db.insert(usersTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminResult[0].id
      })
      .returning()
      .execute();

    // Create first teacher user
    const userResult1 = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create second teacher user
    const userResult2 = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'teacher2@example.com'
      })
      .returning()
      .execute();

    // Create first teacher
    const input1 = {
      ...testInput,
      user_id: userResult1[0].id,
      study_center_id: studyCenterResult[0].id
    };

    await createTeacher(input1);

    // Try to create second teacher with same IC number
    const input2 = {
      ...testInput,
      user_id: userResult2[0].id,
      study_center_id: studyCenterResult[0].id,
      ic_number: testInput.ic_number // Same IC number
    };

    await expect(createTeacher(input2)).rejects.toThrow(/Teacher with IC number 123456-78-9012 already exists/i);
  });
});
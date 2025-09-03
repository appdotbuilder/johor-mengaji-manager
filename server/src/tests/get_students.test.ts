import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, studentsTable } from '../db/schema';
import { type CreateUserInput, type CreateStudyCenterInput, type CreateStudentInput } from '../schema';
import { getStudents } from '../handlers/get_students';

// Test data
const testUser: CreateUserInput = {
  email: 'student@test.com',
  password: 'password123',
  full_name: 'Test Student',
  phone: '0123456789',
  role: 'pelajar',
};

const testAdmin: CreateUserInput = {
  email: 'admin@test.com',
  password: 'password123',
  full_name: 'Test Admin',
  phone: '0123456789',
  role: 'admin_pusat',
};

const testStudyCenter: CreateStudyCenterInput = {
  name: 'Test Study Center',
  address: '123 Test Street',
  phone: '0123456789',
  email: 'center@test.com',
  registration_number: 'REG123',
  admin_id: 1, // Will be set after admin creation
};

const testStudent: CreateStudentInput = {
  user_id: 1, // Will be set after user creation
  study_center_id: 1, // Will be set after study center creation
  ic_number: '123456789012',
  date_of_birth: new Date('1990-01-01'),
  address: '123 Student Street',
  parent_name: 'Parent Name',
  parent_phone: '0987654321',
  emergency_contact: 'Emergency Contact',
};

describe('getStudents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no students exist', async () => {
    const result = await getStudents();
    
    expect(result).toEqual([]);
  });

  it('should return all students with correct data structure', async () => {
    // Create admin user first
    const adminResult = await db.insert(usersTable)
      .values({
        email: testAdmin.email,
        password_hash: 'hashed_password',
        full_name: testAdmin.full_name,
        phone: testAdmin.phone,
        role: testAdmin.role,
      })
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminResult[0].id,
      })
      .returning()
      .execute();

    // Create student user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        phone: testUser.phone,
        role: testUser.role,
      })
      .returning()
      .execute();

    // Create student
    const studentResult = await db.insert(studentsTable)
      .values({
        ...testStudent,
        user_id: userResult[0].id,
        study_center_id: studyCenterResult[0].id,
        date_of_birth: testStudent.date_of_birth.toISOString().split('T')[0], // Convert Date to string
      })
      .returning()
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: studentResult[0].id,
      user_id: userResult[0].id,
      study_center_id: studyCenterResult[0].id,
      ic_number: testStudent.ic_number,
      address: testStudent.address,
      parent_name: testStudent.parent_name,
      parent_phone: testStudent.parent_phone,
      emergency_contact: testStudent.emergency_contact,
      is_active: true,
    });
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple students correctly', async () => {
    // Create admin user
    const adminResult = await db.insert(usersTable)
      .values({
        email: testAdmin.email,
        password_hash: 'hashed_password',
        full_name: testAdmin.full_name,
        phone: testAdmin.phone,
        role: testAdmin.role,
      })
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminResult[0].id,
      })
      .returning()
      .execute();

    // Create first student user
    const user1Result = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        phone: testUser.phone,
        role: testUser.role,
      })
      .returning()
      .execute();

    // Create second student user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'student2@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Student 2',
        phone: '0987654321',
        role: 'pelajar',
      })
      .returning()
      .execute();

    // Create first student
    await db.insert(studentsTable)
      .values({
        ...testStudent,
        user_id: user1Result[0].id,
        study_center_id: studyCenterResult[0].id,
        date_of_birth: testStudent.date_of_birth.toISOString().split('T')[0], // Convert Date to string
      })
      .execute();

    // Create second student
    await db.insert(studentsTable)
      .values({
        user_id: user2Result[0].id,
        study_center_id: studyCenterResult[0].id,
        ic_number: '987654321012',
        date_of_birth: '1995-05-05',
        address: '456 Student Avenue',
        parent_name: 'Parent Two',
        parent_phone: '0123456789',
        emergency_contact: 'Emergency Two',
      })
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(2);
    expect(result[0].ic_number).toEqual('123456789012');
    expect(result[1].ic_number).toEqual('987654321012');
  });

  it('should include both active and inactive students', async () => {
    // Create admin user
    const adminResult = await db.insert(usersTable)
      .values({
        email: testAdmin.email,
        password_hash: 'hashed_password',
        full_name: testAdmin.full_name,
        phone: testAdmin.phone,
        role: testAdmin.role,
      })
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminResult[0].id,
      })
      .returning()
      .execute();

    // Create student user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        phone: testUser.phone,
        role: testUser.role,
      })
      .returning()
      .execute();

    // Create inactive student
    await db.insert(studentsTable)
      .values({
        ...testStudent,
        user_id: userResult[0].id,
        study_center_id: studyCenterResult[0].id,
        date_of_birth: testStudent.date_of_birth.toISOString().split('T')[0], // Convert Date to string
        is_active: false,
      })
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(1);
    expect(result[0].is_active).toBe(false);
  });

  it('should handle students with null optional fields', async () => {
    // Create admin user
    const adminResult = await db.insert(usersTable)
      .values({
        email: testAdmin.email,
        password_hash: 'hashed_password',
        full_name: testAdmin.full_name,
        phone: testAdmin.phone,
        role: testAdmin.role,
      })
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminResult[0].id,
      })
      .returning()
      .execute();

    // Create student user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        phone: testUser.phone,
        role: testUser.role,
      })
      .returning()
      .execute();

    // Create student with null optional fields
    await db.insert(studentsTable)
      .values({
        user_id: userResult[0].id,
        study_center_id: studyCenterResult[0].id,
        ic_number: testStudent.ic_number,
        date_of_birth: testStudent.date_of_birth.toISOString().split('T')[0], // Convert Date to string
        address: testStudent.address,
        parent_name: null,
        parent_phone: null,
        emergency_contact: null,
      })
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(1);
    expect(result[0].parent_name).toBeNull();
    expect(result[0].parent_phone).toBeNull();
    expect(result[0].emergency_contact).toBeNull();
  });
});
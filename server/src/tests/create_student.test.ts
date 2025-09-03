import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentsTable, studyCentersTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { createStudent } from '../handlers/create_student';
import { eq } from 'drizzle-orm';

describe('createStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a user
  const createTestUser = async (role: 'pelajar' | 'pengajar_pusat' = 'pelajar') => {
    const result = await db.insert(usersTable)
      .values({
        email: `test-${Date.now()}@example.com`,
        password_hash: 'hashed_password',
        full_name: 'Test User',
        phone: '0123456789',
        role,
        is_active: true,
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create a study center
  const createTestStudyCenter = async () => {
    // First create an admin user
    const admin = await createTestUser('pengajar_pusat');
    
    const result = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        phone: '0123456789',
        email: 'center@example.com',
        registration_number: 'REG123',
        admin_id: admin.id,
        is_active: true,
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestInput = async (): Promise<CreateStudentInput> => {
    const user = await createTestUser();
    const studyCenter = await createTestStudyCenter();
    
    return {
      user_id: user.id,
      study_center_id: studyCenter.id,
      ic_number: '123456-78-9012',
      date_of_birth: new Date('1995-05-15'),
      address: '456 Student Street, Test City',
      parent_name: 'Parent Name',
      parent_phone: '0987654321',
      emergency_contact: 'Emergency Contact: 0111222333',
    };
  };

  it('should create a student successfully', async () => {
    const input = await createTestInput();
    const result = await createStudent(input);

    // Verify returned student data
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(input.user_id);
    expect(result.study_center_id).toEqual(input.study_center_id);
    expect(result.ic_number).toEqual(input.ic_number);
    expect(result.date_of_birth).toEqual(input.date_of_birth);
    expect(result.address).toEqual(input.address);
    expect(result.parent_name).toEqual(input.parent_name);
    expect(result.parent_phone).toEqual(input.parent_phone);
    expect(result.emergency_contact).toEqual(input.emergency_contact);
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save student to database', async () => {
    const input = await createTestInput();
    const result = await createStudent(input);

    // Verify student was saved to database
    const savedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(savedStudent).toHaveLength(1);
    expect(savedStudent[0].user_id).toEqual(input.user_id);
    expect(savedStudent[0].ic_number).toEqual(input.ic_number);
    expect(savedStudent[0].address).toEqual(input.address);
    expect(savedStudent[0].parent_name).toEqual(input.parent_name);
    expect(savedStudent[0].is_active).toBe(true);
  });

  it('should create student with minimal required fields', async () => {
    const user = await createTestUser();
    const studyCenter = await createTestStudyCenter();
    
    const minimalInput: CreateStudentInput = {
      user_id: user.id,
      study_center_id: studyCenter.id,
      ic_number: '987654-32-1098',
      date_of_birth: new Date('1998-12-20'),
      address: '789 Minimal Address',
      parent_name: null,
      parent_phone: null,
      emergency_contact: null,
    };

    const result = await createStudent(minimalInput);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(minimalInput.user_id);
    expect(result.parent_name).toBeNull();
    expect(result.parent_phone).toBeNull();
    expect(result.emergency_contact).toBeNull();
    expect(result.is_active).toBe(true);
  });

  it('should throw error when user does not exist', async () => {
    const studyCenter = await createTestStudyCenter();
    
    const input: CreateStudentInput = {
      user_id: 99999, // Non-existent user ID
      study_center_id: studyCenter.id,
      ic_number: '111111-11-1111',
      date_of_birth: new Date('2000-01-01'),
      address: 'Test Address',
      parent_name: null,
      parent_phone: null,
      emergency_contact: null,
    };

    await expect(createStudent(input)).rejects.toThrow(/User with ID 99999 not found/);
  });

  it('should throw error when user does not have pelajar role', async () => {
    const userWithWrongRole = await createTestUser('pengajar_pusat');
    const studyCenter = await createTestStudyCenter();
    
    const input: CreateStudentInput = {
      user_id: userWithWrongRole.id,
      study_center_id: studyCenter.id,
      ic_number: '222222-22-2222',
      date_of_birth: new Date('2000-02-02'),
      address: 'Test Address',
      parent_name: null,
      parent_phone: null,
      emergency_contact: null,
    };

    await expect(createStudent(input)).rejects.toThrow(/User must have 'pelajar' role/);
  });

  it('should throw error when study center does not exist', async () => {
    const user = await createTestUser();
    
    const input: CreateStudentInput = {
      user_id: user.id,
      study_center_id: 99999, // Non-existent study center ID
      ic_number: '333333-33-3333',
      date_of_birth: new Date('2000-03-03'),
      address: 'Test Address',
      parent_name: null,
      parent_phone: null,
      emergency_contact: null,
    };

    await expect(createStudent(input)).rejects.toThrow(/Study center with ID 99999 not found/);
  });

  it('should throw error when student profile already exists for user', async () => {
    const input = await createTestInput();
    
    // Create first student profile
    await createStudent(input);
    
    // Try to create another student profile for the same user
    const duplicateInput: CreateStudentInput = {
      ...input,
      ic_number: '444444-44-4444', // Different IC number
      address: 'Different Address',
    };

    await expect(createStudent(duplicateInput)).rejects.toThrow(/Student profile already exists for user ID/);
  });

  it('should throw error when IC number is already registered', async () => {
    const input1 = await createTestInput();
    const user2 = await createTestUser();
    
    // Create first student with IC number
    await createStudent(input1);
    
    // Try to create second student with same IC number
    const input2: CreateStudentInput = {
      ...input1,
      user_id: user2.id,
      ic_number: input1.ic_number, // Same IC number
    };

    await expect(createStudent(input2)).rejects.toThrow(/IC number .* is already registered/);
  });

  it('should handle different date formats correctly', async () => {
    const user = await createTestUser();
    const studyCenter = await createTestStudyCenter();
    
    const input: CreateStudentInput = {
      user_id: user.id,
      study_center_id: studyCenter.id,
      ic_number: '555555-55-5555',
      date_of_birth: new Date('1990-06-15T10:30:00Z'), // Date with time
      address: 'Date Test Address',
      parent_name: null,
      parent_phone: null,
      emergency_contact: null,
    };

    const result = await createStudent(input);
    
    // Verify date is stored correctly (should be date only, not datetime)
    expect(result.date_of_birth).toBeInstanceOf(Date);
    expect(result.date_of_birth.getFullYear()).toBe(1990);
    expect(result.date_of_birth.getMonth()).toBe(5); // June is month 5 (0-indexed)
    expect(result.date_of_birth.getDate()).toBe(15);
  });

  it('should handle long text fields correctly', async () => {
    const user = await createTestUser();
    const studyCenter = await createTestStudyCenter();
    
    const longAddress = 'A'.repeat(500); // Long address
    const longParentName = 'B'.repeat(200); // Long parent name
    const longEmergencyContact = 'C'.repeat(300); // Long emergency contact
    
    const input: CreateStudentInput = {
      user_id: user.id,
      study_center_id: studyCenter.id,
      ic_number: '666666-66-6666',
      date_of_birth: new Date('1985-08-25'),
      address: longAddress,
      parent_name: longParentName,
      parent_phone: '0123456789',
      emergency_contact: longEmergencyContact,
    };

    const result = await createStudent(input);
    
    expect(result.address).toEqual(longAddress);
    expect(result.parent_name).toEqual(longParentName);
    expect(result.emergency_contact).toEqual(longEmergencyContact);
  });
});
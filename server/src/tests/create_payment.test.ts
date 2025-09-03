import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  paymentsTable, 
  usersTable, 
  studyCentersTable, 
  studentsTable 
} from '../db/schema';
import { type CreatePaymentInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

describe('createPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testStudentId: number;
  let testStudyCenterId: number;
  let testRecordingUserId: number;

  beforeEach(async () => {
    // Create prerequisite data for tests
    
    // Create admin user for study center
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword123',
        full_name: 'Admin User',
        phone: '+1234567890',
        role: 'admin_pusat'
      })
      .returning()
      .execute();

    // Create study center
    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        phone: '+1234567890',
        email: 'center@test.com',
        registration_number: 'REG001',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    testStudyCenterId = studyCenter[0].id;

    // Create student user
    const studentUser = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashedpassword123',
        full_name: 'Test Student',
        phone: '+1234567891',
        role: 'pelajar'
      })
      .returning()
      .execute();

    testUserId = studentUser[0].id;

    // Create student record
    const student = await db.insert(studentsTable)
      .values({
        user_id: testUserId,
        study_center_id: testStudyCenterId,
        ic_number: '123456789012',
        date_of_birth: '2000-01-01',
        address: '456 Student Street',
        parent_name: 'Parent Name',
        parent_phone: '+1234567892',
        emergency_contact: '+1234567893'
      })
      .returning()
      .execute();

    testStudentId = student[0].id;

    // Create recording user
    const recordingUser = await db.insert(usersTable)
      .values({
        email: 'recorder@test.com',
        password_hash: 'hashedpassword123',
        full_name: 'Recording User',
        phone: '+1234567894',
        role: 'pengurus_pusat'
      })
      .returning()
      .execute();

    testRecordingUserId = recordingUser[0].id;
  });

  const testInput: CreatePaymentInput = {
    student_id: 0, // Will be set in tests
    study_center_id: 0, // Will be set in tests
    amount: 150.50,
    description: 'Monthly tuition fee',
    due_date: new Date('2024-02-15'),
    recorded_by: 0 // Will be set in tests
  };

  it('should create a payment successfully', async () => {
    const input = {
      ...testInput,
      student_id: testStudentId,
      study_center_id: testStudyCenterId,
      recorded_by: testRecordingUserId
    };

    const result = await createPayment(input);

    // Verify all fields are correctly set
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.student_id).toEqual(testStudentId);
    expect(result.study_center_id).toEqual(testStudyCenterId);
    expect(result.amount).toEqual(150.50);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Monthly tuition fee');
    expect(result.status).toEqual('pending');
    expect(result.due_date).toEqual(new Date('2024-02-15'));
    expect(result.paid_date).toBeNull();
    expect(result.recorded_by).toEqual(testRecordingUserId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save payment to database correctly', async () => {
    const input = {
      ...testInput,
      student_id: testStudentId,
      study_center_id: testStudyCenterId,
      recorded_by: testRecordingUserId
    };

    const result = await createPayment(input);

    // Query database to verify payment was saved
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].student_id).toEqual(testStudentId);
    expect(payments[0].study_center_id).toEqual(testStudyCenterId);
    expect(parseFloat(payments[0].amount)).toEqual(150.50);
    expect(payments[0].description).toEqual('Monthly tuition fee');
    expect(payments[0].status).toEqual('pending');
    expect(payments[0].due_date).toEqual('2024-02-15');
    expect(payments[0].paid_date).toBeNull();
    expect(payments[0].recorded_by).toEqual(testRecordingUserId);
  });

  it('should handle different payment amounts correctly', async () => {
    const input = {
      ...testInput,
      student_id: testStudentId,
      study_center_id: testStudyCenterId,
      recorded_by: testRecordingUserId,
      amount: 999.99
    };

    const result = await createPayment(input);

    expect(result.amount).toEqual(999.99);
    expect(typeof result.amount).toBe('number');
  });

  it('should throw error when student does not exist', async () => {
    const input = {
      ...testInput,
      student_id: 99999, // Non-existent student
      study_center_id: testStudyCenterId,
      recorded_by: testRecordingUserId
    };

    expect(createPayment(input)).rejects.toThrow(/student not found/i);
  });

  it('should throw error when study center does not exist', async () => {
    const input = {
      ...testInput,
      student_id: testStudentId,
      study_center_id: 99999, // Non-existent study center
      recorded_by: testRecordingUserId
    };

    expect(createPayment(input)).rejects.toThrow(/study center not found/i);
  });

  it('should throw error when recording user does not exist', async () => {
    const input = {
      ...testInput,
      student_id: testStudentId,
      study_center_id: testStudyCenterId,
      recorded_by: 99999 // Non-existent user
    };

    expect(createPayment(input)).rejects.toThrow(/recording user not found/i);
  });

  it('should create payment with minimal data', async () => {
    const minimalInput: CreatePaymentInput = {
      student_id: testStudentId,
      study_center_id: testStudyCenterId,
      amount: 50.00,
      description: 'Registration fee',
      due_date: new Date('2024-03-01'),
      recorded_by: testRecordingUserId
    };

    const result = await createPayment(minimalInput);

    expect(result.id).toBeDefined();
    expect(result.amount).toEqual(50.00);
    expect(result.description).toEqual('Registration fee');
    expect(result.status).toEqual('pending');
    expect(result.paid_date).toBeNull();
  });
});
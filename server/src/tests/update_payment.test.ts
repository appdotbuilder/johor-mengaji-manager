import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, studentsTable, paymentsTable } from '../db/schema';
import { type UpdatePaymentInput, type CreateUserInput, type CreateStudyCenterInput, type CreateStudentInput } from '../schema';
import { updatePayment } from '../handlers/update_payment';
import { eq } from 'drizzle-orm';

// Test data
const testAdminUser: CreateUserInput = {
  email: 'admin@test.com',
  password: 'password123',
  full_name: 'Admin User',
  phone: '+60123456789',
  role: 'administrator'
};

const testStudentUser: CreateUserInput = {
  email: 'student@test.com',
  password: 'password123',
  full_name: 'Test Student',
  phone: '+60123456790',
  role: 'pelajar'
};

const testStudyCenter: CreateStudyCenterInput = {
  name: 'Test Study Center',
  address: '123 Test Street, Test City',
  phone: '+60123456788',
  email: 'center@test.com',
  registration_number: 'REG001',
  admin_id: 1 // Will be set after creating admin
};

const testStudent: CreateStudentInput = {
  user_id: 2, // Will be set after creating student user
  study_center_id: 1, // Will be set after creating study center
  ic_number: '990101-01-1234',
  date_of_birth: new Date('1999-01-01'),
  address: '456 Student Street, Test City',
  parent_name: 'Parent Name',
  parent_phone: '+60123456791',
  emergency_contact: '+60123456792'
};

describe('updatePayment', () => {
  let adminId: number;
  let studentId: number;
  let studyCenterId: number;
  let paymentId: number;

  beforeEach(async () => {
    await createDB();

    // Create admin user
    const adminResult = await db.insert(usersTable)
      .values({
        email: testAdminUser.email,
        password_hash: 'hashed_password',
        full_name: testAdminUser.full_name,
        phone: testAdminUser.phone,
        role: testAdminUser.role
      })
      .returning()
      .execute();
    adminId = adminResult[0].id;

    // Create student user
    const studentUserResult = await db.insert(usersTable)
      .values({
        email: testStudentUser.email,
        password_hash: 'hashed_password',
        full_name: testStudentUser.full_name,
        phone: testStudentUser.phone,
        role: testStudentUser.role
      })
      .returning()
      .execute();

    // Create study center
    const studyCenterResult = await db.insert(studyCentersTable)
      .values({
        ...testStudyCenter,
        admin_id: adminId
      })
      .returning()
      .execute();
    studyCenterId = studyCenterResult[0].id;

    // Create student
    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: studentUserResult[0].id,
        study_center_id: studyCenterId,
        ic_number: testStudent.ic_number,
        date_of_birth: testStudent.date_of_birth.toISOString().split('T')[0], // Convert Date to string
        address: testStudent.address,
        parent_name: testStudent.parent_name,
        parent_phone: testStudent.parent_phone,
        emergency_contact: testStudent.emergency_contact
      })
      .returning()
      .execute();
    studentId = studentResult[0].id;

    // Create initial payment
    const paymentResult = await db.insert(paymentsTable)
      .values({
        student_id: studentId,
        study_center_id: studyCenterId,
        amount: '100.00',
        description: 'Monthly fee',
        status: 'pending',
        due_date: '2024-02-01',
        recorded_by: adminId
      })
      .returning()
      .execute();
    paymentId = paymentResult[0].id;
  });

  afterEach(resetDB);

  it('should update payment status successfully', async () => {
    const updateInput: UpdatePaymentInput = {
      id: paymentId,
      status: 'paid'
    };

    const result = await updatePayment(updateInput);

    expect(result.id).toEqual(paymentId);
    expect(result.status).toEqual('paid');
    expect(result.student_id).toEqual(studentId);
    expect(result.study_center_id).toEqual(studyCenterId);
    expect(result.amount).toEqual(100.00);
    expect(typeof result.amount).toEqual('number');
    expect(result.description).toEqual('Monthly fee');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update paid date successfully', async () => {
    const paidDate = new Date('2024-01-15');
    const updateInput: UpdatePaymentInput = {
      id: paymentId,
      paid_date: paidDate
    };

    const result = await updatePayment(updateInput);

    expect(result.id).toEqual(paymentId);
    expect(result.paid_date).toEqual(paidDate);
    expect(result.status).toEqual('pending'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both status and paid date', async () => {
    const paidDate = new Date('2024-01-15');
    const updateInput: UpdatePaymentInput = {
      id: paymentId,
      status: 'paid',
      paid_date: paidDate
    };

    const result = await updatePayment(updateInput);

    expect(result.id).toEqual(paymentId);
    expect(result.status).toEqual('paid');
    expect(result.paid_date).toEqual(paidDate);
    expect(result.amount).toEqual(100.00);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set paid_date to null when explicitly provided', async () => {
    // First set paid_date
    await updatePayment({
      id: paymentId,
      paid_date: new Date('2024-01-15')
    });

    // Then set it to null
    const updateInput: UpdatePaymentInput = {
      id: paymentId,
      paid_date: null
    };

    const result = await updatePayment(updateInput);

    expect(result.id).toEqual(paymentId);
    expect(result.paid_date).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated payment to database', async () => {
    const paidDate = new Date('2024-01-15');
    const updateInput: UpdatePaymentInput = {
      id: paymentId,
      status: 'paid',
      paid_date: paidDate
    };

    await updatePayment(updateInput);

    // Verify in database
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, paymentId))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].status).toEqual('paid');
    expect(payments[0].paid_date ? new Date(payments[0].paid_date) : null).toEqual(paidDate);
    expect(parseFloat(payments[0].amount)).toEqual(100.00);
    expect(payments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update status to overdue', async () => {
    const updateInput: UpdatePaymentInput = {
      id: paymentId,
      status: 'overdue'
    };

    const result = await updatePayment(updateInput);

    expect(result.id).toEqual(paymentId);
    expect(result.status).toEqual('overdue');
    expect(result.paid_date).toBeNull(); // Should remain null
  });

  it('should throw error for non-existent payment', async () => {
    const updateInput: UpdatePaymentInput = {
      id: 99999,
      status: 'paid'
    };

    expect(updatePayment(updateInput)).rejects.toThrow(/Payment with id 99999 not found/i);
  });

  it('should handle minimal update with only id', async () => {
    const updateInput: UpdatePaymentInput = {
      id: paymentId
    };

    const result = await updatePayment(updateInput);

    expect(result.id).toEqual(paymentId);
    expect(result.status).toEqual('pending'); // Should remain unchanged
    expect(result.paid_date).toBeNull(); // Should remain unchanged
    expect(result.amount).toEqual(100.00);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should preserve original payment data when updating status only', async () => {
    const updateInput: UpdatePaymentInput = {
      id: paymentId,
      status: 'paid'
    };

    const result = await updatePayment(updateInput);

    // Verify all original data is preserved
    expect(result.student_id).toEqual(studentId);
    expect(result.study_center_id).toEqual(studyCenterId);
    expect(result.amount).toEqual(100.00);
    expect(result.description).toEqual('Monthly fee');
    expect(result.recorded_by).toEqual(adminId);
    expect(result.due_date).toEqual(new Date('2024-02-01'));
    expect(result.created_at).toBeInstanceOf(Date);

    // Only status and updated_at should change
    expect(result.status).toEqual('paid');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
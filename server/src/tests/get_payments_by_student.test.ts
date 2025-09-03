import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, studentsTable, paymentsTable } from '../db/schema';
import { type GetPaymentsByStudentInput } from '../schema';
import { getPaymentsByStudent } from '../handlers/get_payments_by_student';

describe('getPaymentsByStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all payments for a student', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      email: 'admin@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Admin User',
      phone: '1234567890',
      role: 'administrator'
    }).returning().then(rows => rows[0]);

    const studyCenter = await db.insert(studyCentersTable).values({
      name: 'Test Study Center',
      address: '123 Test St',
      phone: '1234567890',
      email: 'center@test.com',
      registration_number: 'REG001',
      admin_id: user.id
    }).returning().then(rows => rows[0]);

    const studentUser = await db.insert(usersTable).values({
      email: 'student@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Student User',
      phone: '9876543210',
      role: 'pelajar'
    }).returning().then(rows => rows[0]);

    const student = await db.insert(studentsTable).values({
      user_id: studentUser.id,
      study_center_id: studyCenter.id,
      ic_number: '123456789012',
      date_of_birth: '1990-01-01', // Use string format for date
      address: '456 Student St',
      parent_name: 'Parent Name',
      parent_phone: '5555555555',
      emergency_contact: '6666666666'
    }).returning().then(rows => rows[0]);

    // Create test payments
    await db.insert(paymentsTable).values([
      {
        student_id: student.id,
        study_center_id: studyCenter.id,
        amount: '100.50',
        description: 'Monthly fee',
        status: 'pending',
        due_date: '2024-01-01', // Use string format for date
        recorded_by: user.id
      },
      {
        student_id: student.id,
        study_center_id: studyCenter.id,
        amount: '75.25',
        description: 'Book fee',
        status: 'paid',
        due_date: '2024-01-15',
        paid_date: '2024-01-10', // Use string format for date
        recorded_by: user.id
      }
    ]);

    const input: GetPaymentsByStudentInput = {
      student_id: student.id
    };

    const result = await getPaymentsByStudent(input);

    // Should return both payments
    expect(result).toHaveLength(2);
    
    // Verify payment data and numeric conversion
    const pendingPayment = result.find(p => p.status === 'pending');
    expect(pendingPayment).toBeDefined();
    expect(pendingPayment!.amount).toEqual(100.50);
    expect(typeof pendingPayment!.amount).toBe('number');
    expect(pendingPayment!.description).toEqual('Monthly fee');
    expect(pendingPayment!.student_id).toEqual(student.id);
    expect(pendingPayment!.due_date).toBeInstanceOf(Date);
    expect(pendingPayment!.created_at).toBeInstanceOf(Date);

    const paidPayment = result.find(p => p.status === 'paid');
    expect(paidPayment).toBeDefined();
    expect(paidPayment!.amount).toEqual(75.25);
    expect(typeof paidPayment!.amount).toBe('number');
    expect(paidPayment!.description).toEqual('Book fee');
    expect(paidPayment!.paid_date).toBeInstanceOf(Date);
    expect(paidPayment!.due_date).toBeInstanceOf(Date);
  });

  it('should filter payments by status', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      email: 'admin@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Admin User',
      phone: '1234567890',
      role: 'administrator'
    }).returning().then(rows => rows[0]);

    const studyCenter = await db.insert(studyCentersTable).values({
      name: 'Test Study Center',
      address: '123 Test St',
      phone: '1234567890',
      email: 'center@test.com',
      registration_number: 'REG001',
      admin_id: user.id
    }).returning().then(rows => rows[0]);

    const studentUser = await db.insert(usersTable).values({
      email: 'student@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Student User',
      phone: '9876543210',
      role: 'pelajar'
    }).returning().then(rows => rows[0]);

    const student = await db.insert(studentsTable).values({
      user_id: studentUser.id,
      study_center_id: studyCenter.id,
      ic_number: '123456789012',
      date_of_birth: '1990-01-01',
      address: '456 Student St',
      parent_name: 'Parent Name',
      parent_phone: '5555555555',
      emergency_contact: '6666666666'
    }).returning().then(rows => rows[0]);

    // Create payments with different statuses
    await db.insert(paymentsTable).values([
      {
        student_id: student.id,
        study_center_id: studyCenter.id,
        amount: '100.00',
        description: 'Pending payment',
        status: 'pending',
        due_date: '2024-01-01',
        recorded_by: user.id
      },
      {
        student_id: student.id,
        study_center_id: studyCenter.id,
        amount: '75.00',
        description: 'Paid payment',
        status: 'paid',
        due_date: '2024-01-15',
        paid_date: '2024-01-10',
        recorded_by: user.id
      },
      {
        student_id: student.id,
        study_center_id: studyCenter.id,
        amount: '50.00',
        description: 'Overdue payment',
        status: 'overdue',
        due_date: '2023-12-01',
        recorded_by: user.id
      }
    ]);

    // Test filtering by 'paid' status
    const paidInput: GetPaymentsByStudentInput = {
      student_id: student.id,
      status: 'paid'
    };

    const paidResults = await getPaymentsByStudent(paidInput);

    expect(paidResults).toHaveLength(1);
    expect(paidResults[0].status).toEqual('paid');
    expect(paidResults[0].amount).toEqual(75);
    expect(paidResults[0].description).toEqual('Paid payment');
    expect(paidResults[0].paid_date).toBeInstanceOf(Date);

    // Test filtering by 'pending' status
    const pendingInput: GetPaymentsByStudentInput = {
      student_id: student.id,
      status: 'pending'
    };

    const pendingResults = await getPaymentsByStudent(pendingInput);

    expect(pendingResults).toHaveLength(1);
    expect(pendingResults[0].status).toEqual('pending');
    expect(pendingResults[0].amount).toEqual(100);
    expect(pendingResults[0].description).toEqual('Pending payment');
  });

  it('should return empty array for non-existent student', async () => {
    const input: GetPaymentsByStudentInput = {
      student_id: 999999
    };

    const result = await getPaymentsByStudent(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when student has no payments', async () => {
    // Create prerequisite data but no payments
    const user = await db.insert(usersTable).values({
      email: 'admin@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Admin User',
      phone: '1234567890',
      role: 'administrator'
    }).returning().then(rows => rows[0]);

    const studyCenter = await db.insert(studyCentersTable).values({
      name: 'Test Study Center',
      address: '123 Test St',
      phone: '1234567890',
      email: 'center@test.com',
      registration_number: 'REG001',
      admin_id: user.id
    }).returning().then(rows => rows[0]);

    const studentUser = await db.insert(usersTable).values({
      email: 'student@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Student User',
      phone: '9876543210',
      role: 'pelajar'
    }).returning().then(rows => rows[0]);

    const student = await db.insert(studentsTable).values({
      user_id: studentUser.id,
      study_center_id: studyCenter.id,
      ic_number: '123456789012',
      date_of_birth: '1990-01-01',
      address: '456 Student St',
      parent_name: 'Parent Name',
      parent_phone: '5555555555',
      emergency_contact: '6666666666'
    }).returning().then(rows => rows[0]);

    const input: GetPaymentsByStudentInput = {
      student_id: student.id
    };

    const result = await getPaymentsByStudent(input);

    expect(result).toHaveLength(0);
  });

  it('should handle multiple students correctly', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      email: 'admin@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Admin User',
      phone: '1234567890',
      role: 'administrator'
    }).returning().then(rows => rows[0]);

    const studyCenter = await db.insert(studyCentersTable).values({
      name: 'Test Study Center',
      address: '123 Test St',
      phone: '1234567890',
      email: 'center@test.com',
      registration_number: 'REG001',
      admin_id: user.id
    }).returning().then(rows => rows[0]);

    // Create two students
    const studentUser1 = await db.insert(usersTable).values({
      email: 'student1@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Student One',
      phone: '9876543210',
      role: 'pelajar'
    }).returning().then(rows => rows[0]);

    const student1 = await db.insert(studentsTable).values({
      user_id: studentUser1.id,
      study_center_id: studyCenter.id,
      ic_number: '123456789012',
      date_of_birth: '1990-01-01',
      address: '456 Student St',
      parent_name: 'Parent One',
      parent_phone: '5555555555',
      emergency_contact: '6666666666'
    }).returning().then(rows => rows[0]);

    const studentUser2 = await db.insert(usersTable).values({
      email: 'student2@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Student Two',
      phone: '9876543211',
      role: 'pelajar'
    }).returning().then(rows => rows[0]);

    const student2 = await db.insert(studentsTable).values({
      user_id: studentUser2.id,
      study_center_id: studyCenter.id,
      ic_number: '123456789013',
      date_of_birth: '1991-01-01',
      address: '789 Student Ave',
      parent_name: 'Parent Two',
      parent_phone: '5555555556',
      emergency_contact: '6666666667'
    }).returning().then(rows => rows[0]);

    // Create payments for both students
    await db.insert(paymentsTable).values([
      {
        student_id: student1.id,
        study_center_id: studyCenter.id,
        amount: '100.00',
        description: 'Student 1 payment',
        status: 'pending',
        due_date: '2024-01-01',
        recorded_by: user.id
      },
      {
        student_id: student2.id,
        study_center_id: studyCenter.id,
        amount: '200.00',
        description: 'Student 2 payment',
        status: 'paid',
        due_date: '2024-01-15',
        paid_date: '2024-01-10',
        recorded_by: user.id
      }
    ]);

    // Query student 1 payments
    const input1: GetPaymentsByStudentInput = {
      student_id: student1.id
    };

    const result1 = await getPaymentsByStudent(input1);

    expect(result1).toHaveLength(1);
    expect(result1[0].student_id).toEqual(student1.id);
    expect(result1[0].amount).toEqual(100);
    expect(result1[0].description).toEqual('Student 1 payment');
    expect(result1[0].due_date).toBeInstanceOf(Date);

    // Query student 2 payments
    const input2: GetPaymentsByStudentInput = {
      student_id: student2.id
    };

    const result2 = await getPaymentsByStudent(input2);

    expect(result2).toHaveLength(1);
    expect(result2[0].student_id).toEqual(student2.id);
    expect(result2[0].amount).toEqual(200);
    expect(result2[0].description).toEqual('Student 2 payment');
    expect(result2[0].paid_date).toBeInstanceOf(Date);
  });
});
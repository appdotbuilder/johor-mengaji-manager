import { db } from '../db';
import { paymentsTable, studentsTable, studyCentersTable, usersTable } from '../db/schema';
import { type CreatePaymentInput, type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export const createPayment = async (input: CreatePaymentInput): Promise<Payment> => {
  try {
    // Validate that the student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (student.length === 0) {
      throw new Error('Student not found');
    }

    // Validate that the study center exists
    const studyCenter = await db.select()
      .from(studyCentersTable)
      .where(eq(studyCentersTable.id, input.study_center_id))
      .execute();

    if (studyCenter.length === 0) {
      throw new Error('Study center not found');
    }

    // Validate that the recording user exists
    const recordingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.recorded_by))
      .execute();

    if (recordingUser.length === 0) {
      throw new Error('Recording user not found');
    }

    // Create the payment record
    const result = await db.insert(paymentsTable)
      .values({
        student_id: input.student_id,
        study_center_id: input.study_center_id,
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description,
        status: 'pending', // Default status
        due_date: input.due_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        paid_date: null, // Default to null for new payments
        recorded_by: input.recorded_by
      })
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const payment = result[0];
    return {
      ...payment,
      amount: parseFloat(payment.amount), // Convert string back to number
      due_date: new Date(payment.due_date), // Convert string back to Date
      paid_date: payment.paid_date ? new Date(payment.paid_date) : null // Convert string back to Date if not null
    };
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
};
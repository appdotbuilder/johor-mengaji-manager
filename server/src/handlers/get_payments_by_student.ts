import { db } from '../db';
import { paymentsTable } from '../db/schema';
import { eq, and, type SQL } from 'drizzle-orm';
import { type GetPaymentsByStudentInput, type Payment } from '../schema';

export async function getPaymentsByStudent(input: GetPaymentsByStudentInput): Promise<Payment[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [
      eq(paymentsTable.student_id, input.student_id)
    ];

    // Add optional status filter
    if (input.status) {
      conditions.push(eq(paymentsTable.status, input.status));
    }

    // Build and execute query with proper where clause
    const results = await db.select()
      .from(paymentsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Convert fields to proper types before returning
    return results.map(payment => ({
      ...payment,
      amount: parseFloat(payment.amount), // Convert string back to number
      due_date: new Date(payment.due_date), // Convert string to Date
      paid_date: payment.paid_date ? new Date(payment.paid_date) : null, // Convert string to Date if exists
      created_at: new Date(payment.created_at), // Convert to Date
      updated_at: new Date(payment.updated_at) // Convert to Date
    }));
  } catch (error) {
    console.error('Failed to fetch payments by student:', error);
    throw error;
  }
}
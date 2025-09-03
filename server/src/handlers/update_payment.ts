import { db } from '../db';
import { paymentsTable } from '../db/schema';
import { type UpdatePaymentInput, type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePayment = async (input: UpdatePaymentInput): Promise<Payment> => {
  try {
    // First, check if payment exists
    const existingPayment = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, input.id))
      .execute();

    if (existingPayment.length === 0) {
      throw new Error(`Payment with id ${input.id} not found`);
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.paid_date !== undefined) {
      updateData.paid_date = input.paid_date;
    }

    // Update the payment record
    const result = await db.update(paymentsTable)
      .set(updateData)
      .where(eq(paymentsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers and dates back to Date objects
    const payment = result[0];
    return {
      ...payment,
      amount: parseFloat(payment.amount),
      due_date: new Date(payment.due_date),
      paid_date: payment.paid_date ? new Date(payment.paid_date) : null,
      created_at: new Date(payment.created_at),
      updated_at: new Date(payment.updated_at)
    };
  } catch (error) {
    console.error('Payment update failed:', error);
    throw error;
  }
};
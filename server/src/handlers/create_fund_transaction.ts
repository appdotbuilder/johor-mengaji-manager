import { db } from '../db';
import { fundTransactionsTable, studyCentersTable, usersTable } from '../db/schema';
import { type CreateFundTransactionInput, type FundTransaction } from '../schema';
import { eq } from 'drizzle-orm';

export const createFundTransaction = async (input: CreateFundTransactionInput): Promise<FundTransaction> => {
  try {
    // Validate that the study center exists
    const studyCenter = await db.select()
      .from(studyCentersTable)
      .where(eq(studyCentersTable.id, input.study_center_id))
      .execute();

    if (studyCenter.length === 0) {
      throw new Error(`Study center with ID ${input.study_center_id} not found`);
    }

    // Validate that the recorded_by user exists
    const recordedByUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.recorded_by))
      .execute();

    if (recordedByUser.length === 0) {
      throw new Error(`User with ID ${input.recorded_by} not found`);
    }

    // Insert fund transaction record
    const result = await db.insert(fundTransactionsTable)
      .values({
        study_center_id: input.study_center_id,
        fund_type: input.fund_type,
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description,
        contributor_name: input.contributor_name,
        contributor_phone: input.contributor_phone,
        transaction_date: input.transaction_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        recorded_by: input.recorded_by,
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and handle date conversion
    const fundTransaction = result[0];
    return {
      ...fundTransaction,
      amount: parseFloat(fundTransaction.amount), // Convert string back to number
      transaction_date: new Date(fundTransaction.transaction_date) // Convert date string to Date
    };
  } catch (error) {
    console.error('Fund transaction creation failed:', error);
    throw error;
  }
};
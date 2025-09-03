import { db } from '../db';
import { fundTransactionsTable } from '../db/schema';
import { type FundTransaction } from '../schema';
import { eq, and, gte, lte, desc, type SQL } from 'drizzle-orm';
import { z } from 'zod';

// Input schema for filtering fund transactions
const getFundTransactionsInputSchema = z.object({
  study_center_id: z.number().optional(),
  fund_type: z.enum(['donation', 'study', 'waqf', 'infaq', 'sadaqa']).optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().nonnegative().default(0),
});

type ParsedInput = z.infer<typeof getFundTransactionsInputSchema>;
export type GetFundTransactionsInput = Partial<Omit<ParsedInput, 'limit' | 'offset'>> & {
  limit?: number;
  offset?: number;
};

export const getFundTransactions = async (
  input: Partial<GetFundTransactionsInput> = {}
): Promise<FundTransaction[]> => {
  try {
    // Parse and validate input with defaults
    const filters = getFundTransactionsInputSchema.parse(input);

    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (filters.study_center_id !== undefined) {
      conditions.push(eq(fundTransactionsTable.study_center_id, filters.study_center_id));
    }

    if (filters.fund_type !== undefined) {
      conditions.push(eq(fundTransactionsTable.fund_type, filters.fund_type));
    }

    if (filters.date_from !== undefined) {
      conditions.push(gte(fundTransactionsTable.transaction_date, filters.date_from.toISOString().split('T')[0]));
    }

    if (filters.date_to !== undefined) {
      conditions.push(lte(fundTransactionsTable.transaction_date, filters.date_to.toISOString().split('T')[0]));
    }

    // Build and execute query
    const baseQuery = db.select().from(fundTransactionsTable);
    
    const finalQuery = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await finalQuery
      .orderBy(desc(fundTransactionsTable.transaction_date))
      .limit(filters.limit)
      .offset(filters.offset)
      .execute();

    // Convert fields to proper types
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount), // Convert numeric string to number
      transaction_date: new Date(transaction.transaction_date), // Convert string to Date
    }));
  } catch (error) {
    console.error('Failed to fetch fund transactions:', error);
    throw error;
  }
};
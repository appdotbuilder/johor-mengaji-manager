import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, fundTransactionsTable } from '../db/schema';
import { type CreateUserInput, type CreateStudyCenterInput, type CreateFundTransactionInput } from '../schema';
import { getFundTransactions, type GetFundTransactionsInput } from '../handlers/get_fund_transactions';

// Test data
const testUser: CreateUserInput = {
  email: 'admin@test.com',
  password: 'password123',
  full_name: 'Test Admin',
  phone: '+1234567890',
  role: 'administrator'
};

const testStudyCenter: CreateStudyCenterInput = {
  name: 'Test Study Center',
  address: '123 Test Street',
  phone: '+1234567890',
  email: 'center@test.com',
  registration_number: 'REG123',
  admin_id: 1
};

// For database insertion (strings for date and amount)
const testFundTransaction = {
  study_center_id: 1,
  fund_type: 'donation' as const,
  amount: '250.50',
  description: 'Monthly donation',
  contributor_name: 'John Doe',
  contributor_phone: '+1234567890',
  transaction_date: '2024-01-15',
  recorded_by: 1
};

describe('getFundTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getFundTransactions();
    expect(result).toEqual([]);
  });

  it('should fetch all fund transactions without filters', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      ...testUser,
      password_hash: 'hashed_password'
    }).execute();

    await db.insert(studyCentersTable).values(testStudyCenter).execute();

    // Create fund transactions
    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      amount: testFundTransaction.amount.toString()
    }).execute();

    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      fund_type: 'waqf',
      amount: '500.75',
      description: 'Waqf contribution',
      transaction_date: '2024-01-20'
    }).execute();

    const result = await getFundTransactions();

    expect(result).toHaveLength(2);
    expect(result[0].fund_type).toEqual('waqf'); // Should be ordered by date desc
    expect(result[0].amount).toEqual(500.75);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].description).toEqual('Waqf contribution');
    
    expect(result[1].fund_type).toEqual('donation');
    expect(result[1].amount).toEqual(250.5);
    expect(result[1].description).toEqual('Monthly donation');
  });

  it('should filter by study center id', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      ...testUser,
      password_hash: 'hashed_password'
    }).execute();

    await db.insert(studyCentersTable).values(testStudyCenter).execute();
    await db.insert(studyCentersTable).values({
      ...testStudyCenter,
      name: 'Another Study Center',
      admin_id: 1
    }).execute();

    // Create transactions for different study centers
    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      study_center_id: 1,
      amount: '100.00'
    }).execute();

    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      study_center_id: 2,
      amount: '200.00',
      description: 'Center 2 donation'
    }).execute();

    const input: GetFundTransactionsInput = { study_center_id: 1 };
    const result = await getFundTransactions(input);

    expect(result).toHaveLength(1);
    expect(result[0].study_center_id).toEqual(1);
    expect(result[0].amount).toEqual(100);
    expect(result[0].description).toEqual('Monthly donation');
  });

  it('should filter by fund type', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      ...testUser,
      password_hash: 'hashed_password'
    }).execute();

    await db.insert(studyCentersTable).values(testStudyCenter).execute();

    // Create transactions with different fund types
    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      fund_type: 'donation',
      amount: '100.00'
    }).execute();

    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      fund_type: 'waqf',
      amount: '200.00'
    }).execute();

    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      fund_type: 'infaq',
      amount: '300.00'
    }).execute();

    const input: GetFundTransactionsInput = { fund_type: 'waqf' };
    const result = await getFundTransactions(input);

    expect(result).toHaveLength(1);
    expect(result[0].fund_type).toEqual('waqf');
    expect(result[0].amount).toEqual(200);
  });

  it('should filter by date range', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      ...testUser,
      password_hash: 'hashed_password'
    }).execute();

    await db.insert(studyCentersTable).values(testStudyCenter).execute();

    // Create transactions with different dates
    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      transaction_date: '2024-01-10',
      amount: '100.00',
      description: 'Early transaction'
    }).execute();

    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      transaction_date: '2024-01-20',
      amount: '200.00',
      description: 'Mid transaction'
    }).execute();

    await db.insert(fundTransactionsTable).values({
      ...testFundTransaction,
      transaction_date: '2024-01-30',
      amount: '300.00',
      description: 'Late transaction'
    }).execute();

    const input: GetFundTransactionsInput = {
      date_from: new Date('2024-01-15'),
      date_to: new Date('2024-01-25')
    };
    const result = await getFundTransactions(input);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(200);
    expect(result[0].description).toEqual('Mid transaction');
    expect(result[0].transaction_date).toEqual(new Date('2024-01-20'));
  });

  it('should apply multiple filters simultaneously', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      ...testUser,
      password_hash: 'hashed_password'
    }).execute();

    await db.insert(studyCentersTable).values(testStudyCenter).execute();
    await db.insert(studyCentersTable).values({
      ...testStudyCenter,
      name: 'Another Study Center',
      admin_id: 1
    }).execute();

    // Create various transactions
    await db.insert(fundTransactionsTable).values([
      {
        ...testFundTransaction,
        study_center_id: 1,
        fund_type: 'donation',
        transaction_date: '2024-01-15',
        amount: '100.00'
      },
      {
        ...testFundTransaction,
        study_center_id: 1,
        fund_type: 'waqf',
        transaction_date: '2024-01-15',
        amount: '200.00'
      },
      {
        ...testFundTransaction,
        study_center_id: 2,
        fund_type: 'donation',
        transaction_date: '2024-01-15',
        amount: '300.00'
      },
      {
        ...testFundTransaction,
        study_center_id: 1,
        fund_type: 'donation',
        transaction_date: '2024-01-25',
        amount: '400.00'
      }
    ]).execute();

    const input: GetFundTransactionsInput = {
      study_center_id: 1,
      fund_type: 'donation',
      date_from: new Date('2024-01-10'),
      date_to: new Date('2024-01-20')
    };
    const result = await getFundTransactions(input);

    expect(result).toHaveLength(1);
    expect(result[0].study_center_id).toEqual(1);
    expect(result[0].fund_type).toEqual('donation');
    expect(result[0].amount).toEqual(100);
  });

  it('should respect pagination limits', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      ...testUser,
      password_hash: 'hashed_password'
    }).execute();

    await db.insert(studyCentersTable).values(testStudyCenter).execute();

    // Create multiple transactions
    const transactions = Array.from({ length: 15 }, (_, i) => ({
      ...testFundTransaction,
      amount: (100 + i).toString(),
      description: `Transaction ${i + 1}`,
      transaction_date: `2024-01-${String(i + 1).padStart(2, '0')}`
    }));

    await db.insert(fundTransactionsTable).values(transactions).execute();

    // Test limit
    const limitedResult = await getFundTransactions({ limit: 5 });
    expect(limitedResult).toHaveLength(5);

    // Test offset
    const offsetResult = await getFundTransactions({ limit: 5, offset: 5 });
    expect(offsetResult).toHaveLength(5);
    expect(offsetResult[0].id).not.toEqual(limitedResult[0].id);
  });

  it('should handle date-only filtering correctly', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      ...testUser,
      password_hash: 'hashed_password'
    }).execute();

    await db.insert(studyCentersTable).values(testStudyCenter).execute();

    // Create transactions
    await db.insert(fundTransactionsTable).values([
      {
        ...testFundTransaction,
        transaction_date: '2024-01-10',
        amount: '100.00'
      },
      {
        ...testFundTransaction,
        transaction_date: '2024-01-20',
        amount: '200.00'
      }
    ]).execute();

    // Test date_from only
    const fromResult = await getFundTransactions({ date_from: new Date('2024-01-15') });
    expect(fromResult).toHaveLength(1);
    expect(fromResult[0].amount).toEqual(200);

    // Test date_to only
    const toResult = await getFundTransactions({ date_to: new Date('2024-01-15') });
    expect(toResult).toHaveLength(1);
    expect(toResult[0].amount).toEqual(100);
  });

  it('should preserve all transaction fields correctly', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      ...testUser,
      password_hash: 'hashed_password'
    }).execute();

    await db.insert(studyCentersTable).values(testStudyCenter).execute();

    // Create transaction with all fields
    const fullTransaction = {
      study_center_id: 1,
      fund_type: 'sadaqa' as const,
      amount: '999.99',
      description: 'Complete transaction',
      contributor_name: 'Jane Smith',
      contributor_phone: '+9876543210',
      transaction_date: '2024-02-15',
      recorded_by: 1
    };

    await db.insert(fundTransactionsTable).values(fullTransaction).execute();

    const result = await getFundTransactions();

    expect(result).toHaveLength(1);
    const transaction = result[0];
    
    expect(transaction.id).toBeDefined();
    expect(transaction.study_center_id).toEqual(1);
    expect(transaction.fund_type).toEqual('sadaqa');
    expect(transaction.amount).toEqual(999.99);
    expect(typeof transaction.amount).toBe('number');
    expect(transaction.description).toEqual('Complete transaction');
    expect(transaction.contributor_name).toEqual('Jane Smith');
    expect(transaction.contributor_phone).toEqual('+9876543210');
    expect(transaction.transaction_date).toEqual(new Date('2024-02-15'));
    expect(transaction.recorded_by).toEqual(1);
    expect(transaction.created_at).toBeInstanceOf(Date);
  });
});
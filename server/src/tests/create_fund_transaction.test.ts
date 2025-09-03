import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fundTransactionsTable, studyCentersTable, usersTable } from '../db/schema';
import { type CreateFundTransactionInput } from '../schema';
import { createFundTransaction } from '../handlers/create_fund_transaction';
import { eq } from 'drizzle-orm';

// Test user and study center data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  full_name: 'Test User',
  phone: '123456789',
  role: 'admin_pusat' as const,
};

const testAdmin = {
  email: 'admin@example.com',
  password_hash: 'admin_password',
  full_name: 'Test Admin',
  phone: '987654321',
  role: 'administrator' as const,
};

const testStudyCenter = {
  name: 'Test Study Center',
  address: '123 Test Street',
  phone: '555-0123',
  email: 'center@example.com',
  registration_number: 'TC001',
};

// Test input for fund transaction
const testInput: CreateFundTransactionInput = {
  study_center_id: 1,
  fund_type: 'donation',
  amount: 500.00,
  description: 'Monthly donation',
  contributor_name: 'John Donor',
  contributor_phone: '555-1234',
  transaction_date: new Date('2024-01-15'),
  recorded_by: 1,
};

describe('createFundTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a fund transaction with all fields', async () => {
    // Create prerequisite data
    const adminResult = await db.insert(usersTable).values(testAdmin).returning().execute();
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    
    const studyCenterData = {
      ...testStudyCenter,
      admin_id: adminResult[0].id,
    };
    const studyCenterResult = await db.insert(studyCentersTable).values(studyCenterData).returning().execute();

    const input = {
      ...testInput,
      study_center_id: studyCenterResult[0].id,
      recorded_by: userResult[0].id,
    };

    const result = await createFundTransaction(input);

    // Basic field validation
    expect(result.study_center_id).toEqual(studyCenterResult[0].id);
    expect(result.fund_type).toEqual('donation');
    expect(result.amount).toEqual(500.00);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Monthly donation');
    expect(result.contributor_name).toEqual('John Donor');
    expect(result.contributor_phone).toEqual('555-1234');
    expect(result.transaction_date).toEqual(new Date('2024-01-15'));
    expect(result.recorded_by).toEqual(userResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a fund transaction with minimal required fields', async () => {
    // Create prerequisite data
    const adminResult = await db.insert(usersTable).values(testAdmin).returning().execute();
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    
    const studyCenterData = {
      ...testStudyCenter,
      admin_id: adminResult[0].id,
    };
    const studyCenterResult = await db.insert(studyCentersTable).values(studyCenterData).returning().execute();

    const minimalInput: CreateFundTransactionInput = {
      study_center_id: studyCenterResult[0].id,
      fund_type: 'waqf',
      amount: 1000.50,
      description: 'Waqf contribution',
      contributor_name: null,
      contributor_phone: null,
      transaction_date: new Date('2024-02-01'),
      recorded_by: userResult[0].id,
    };

    const result = await createFundTransaction(minimalInput);

    expect(result.fund_type).toEqual('waqf');
    expect(result.amount).toEqual(1000.50);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Waqf contribution');
    expect(result.contributor_name).toBeNull();
    expect(result.contributor_phone).toBeNull();
    expect(result.transaction_date).toEqual(new Date('2024-02-01'));
  });

  it('should save fund transaction to database correctly', async () => {
    // Create prerequisite data
    const adminResult = await db.insert(usersTable).values(testAdmin).returning().execute();
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    
    const studyCenterData = {
      ...testStudyCenter,
      admin_id: adminResult[0].id,
    };
    const studyCenterResult = await db.insert(studyCentersTable).values(studyCenterData).returning().execute();

    const input = {
      ...testInput,
      study_center_id: studyCenterResult[0].id,
      recorded_by: userResult[0].id,
    };

    const result = await createFundTransaction(input);

    // Query database to verify the record was saved
    const fundTransactions = await db.select()
      .from(fundTransactionsTable)
      .where(eq(fundTransactionsTable.id, result.id))
      .execute();

    expect(fundTransactions).toHaveLength(1);
    const savedTransaction = fundTransactions[0];
    
    expect(savedTransaction.study_center_id).toEqual(studyCenterResult[0].id);
    expect(savedTransaction.fund_type).toEqual('donation');
    expect(parseFloat(savedTransaction.amount)).toEqual(500.00);
    expect(savedTransaction.description).toEqual('Monthly donation');
    expect(savedTransaction.contributor_name).toEqual('John Donor');
    expect(savedTransaction.contributor_phone).toEqual('555-1234');
    expect(new Date(savedTransaction.transaction_date)).toEqual(new Date('2024-01-15'));
    expect(savedTransaction.recorded_by).toEqual(userResult[0].id);
    expect(savedTransaction.created_at).toBeInstanceOf(Date);
  });

  it('should handle different fund types correctly', async () => {
    // Create prerequisite data
    const adminResult = await db.insert(usersTable).values(testAdmin).returning().execute();
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    
    const studyCenterData = {
      ...testStudyCenter,
      admin_id: adminResult[0].id,
    };
    const studyCenterResult = await db.insert(studyCentersTable).values(studyCenterData).returning().execute();

    const fundTypes = ['donation', 'study', 'waqf', 'infaq', 'sadaqa'] as const;
    
    for (const fundType of fundTypes) {
      const input = {
        study_center_id: studyCenterResult[0].id,
        fund_type: fundType,
        amount: 100.00,
        description: `${fundType} contribution`,
        contributor_name: 'Test Contributor',
        contributor_phone: '555-9999',
        transaction_date: new Date('2024-01-01'),
        recorded_by: userResult[0].id,
      };

      const result = await createFundTransaction(input);
      expect(result.fund_type).toEqual(fundType);
      expect(result.description).toEqual(`${fundType} contribution`);
    }
  });

  it('should throw error when study center does not exist', async () => {
    // Create user but no study center
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();

    const input = {
      ...testInput,
      study_center_id: 999, // Non-existent study center
      recorded_by: userResult[0].id,
    };

    await expect(createFundTransaction(input)).rejects.toThrow(/study center.*not found/i);
  });

  it('should throw error when recorded_by user does not exist', async () => {
    // Create study center but no recorded_by user
    const adminResult = await db.insert(usersTable).values(testAdmin).returning().execute();
    
    const studyCenterData = {
      ...testStudyCenter,
      admin_id: adminResult[0].id,
    };
    const studyCenterResult = await db.insert(studyCentersTable).values(studyCenterData).returning().execute();

    const input = {
      ...testInput,
      study_center_id: studyCenterResult[0].id,
      recorded_by: 999, // Non-existent user
    };

    await expect(createFundTransaction(input)).rejects.toThrow(/user.*not found/i);
  });

  it('should handle decimal amounts correctly', async () => {
    // Create prerequisite data
    const adminResult = await db.insert(usersTable).values(testAdmin).returning().execute();
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    
    const studyCenterData = {
      ...testStudyCenter,
      admin_id: adminResult[0].id,
    };
    const studyCenterResult = await db.insert(studyCentersTable).values(studyCenterData).returning().execute();

    const input = {
      ...testInput,
      study_center_id: studyCenterResult[0].id,
      recorded_by: userResult[0].id,
      amount: 123.45, // Test decimal precision
    };

    const result = await createFundTransaction(input);

    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const savedTransaction = await db.select()
      .from(fundTransactionsTable)
      .where(eq(fundTransactionsTable.id, result.id))
      .execute();

    expect(parseFloat(savedTransaction[0].amount)).toEqual(123.45);
  });
});
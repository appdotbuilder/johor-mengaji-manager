import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { materialDistributionsTable, usersTable, studyCentersTable } from '../db/schema';
import { type CreateMaterialDistributionInput } from '../schema';
import { createMaterialDistribution } from '../handlers/create_material_distribution';
import { eq } from 'drizzle-orm';

// Test data setup
let testStudyCenterId: number;
let testAdminUserId: number;
let testRecipientUserId: number;

const setupTestData = async () => {
  // Create test admin user
  const adminUsers = await db.insert(usersTable)
    .values({
      email: 'admin@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Test Admin',
      phone: '1234567890',
      role: 'administrator',
    })
    .returning()
    .execute();
  testAdminUserId = adminUsers[0].id;

  // Create test study center
  const studyCenters = await db.insert(studyCentersTable)
    .values({
      name: 'Test Study Center',
      address: '123 Test Street',
      admin_id: testAdminUserId,
    })
    .returning()
    .execute();
  testStudyCenterId = studyCenters[0].id;

  // Create test recipient user
  const recipientUsers = await db.insert(usersTable)
    .values({
      email: 'recipient@test.com',
      password_hash: 'hashedpassword',
      full_name: 'Test Recipient',
      phone: '0987654321',
      role: 'pelajar',
    })
    .returning()
    .execute();
  testRecipientUserId = recipientUsers[0].id;
};

// Test input for charity distribution
const testCharityInput: CreateMaterialDistributionInput = {
  study_center_id: 0, // Will be set in setupTestData
  material_type: 'quran',
  item_name: 'Al-Quran Mushaf Madinah',
  quantity: 10,
  recipient_id: null,
  distribution_date: new Date('2024-01-15'),
  is_sale: false,
  price: null,
  notes: 'Free distribution to new students',
  recorded_by: 0, // Will be set in setupTestData
};

// Test input for sale distribution
const testSaleInput: CreateMaterialDistributionInput = {
  study_center_id: 0, // Will be set in setupTestData
  material_type: 'notebook',
  item_name: 'Arabic Notebook Set',
  quantity: 5,
  recipient_id: 0, // Will be set in setupTestData
  distribution_date: new Date('2024-01-16'),
  is_sale: true,
  price: 25.50,
  notes: 'Sold to student for practice',
  recorded_by: 0, // Will be set in setupTestData
};

describe('createMaterialDistribution', () => {
  beforeEach(async () => {
    await createDB();
    await setupTestData();
    // Update test inputs with actual IDs
    testCharityInput.study_center_id = testStudyCenterId;
    testCharityInput.recorded_by = testAdminUserId;
    testSaleInput.study_center_id = testStudyCenterId;
    testSaleInput.recipient_id = testRecipientUserId;
    testSaleInput.recorded_by = testAdminUserId;
  });

  afterEach(resetDB);

  it('should create a charity material distribution', async () => {
    const result = await createMaterialDistribution(testCharityInput);

    // Basic field validation
    expect(result.study_center_id).toEqual(testStudyCenterId);
    expect(result.material_type).toEqual('quran');
    expect(result.item_name).toEqual('Al-Quran Mushaf Madinah');
    expect(result.quantity).toEqual(10);
    expect(result.recipient_id).toBeNull();
    expect(result.distribution_date).toEqual(new Date('2024-01-15'));
    expect(result.is_sale).toBe(false);
    expect(result.price).toBeNull();
    expect(result.notes).toEqual('Free distribution to new students');
    expect(result.recorded_by).toEqual(testAdminUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a sale material distribution', async () => {
    const result = await createMaterialDistribution(testSaleInput);

    // Basic field validation
    expect(result.study_center_id).toEqual(testStudyCenterId);
    expect(result.material_type).toEqual('notebook');
    expect(result.item_name).toEqual('Arabic Notebook Set');
    expect(result.quantity).toEqual(5);
    expect(result.recipient_id).toEqual(testRecipientUserId);
    expect(result.distribution_date).toEqual(new Date('2024-01-16'));
    expect(result.is_sale).toBe(true);
    expect(result.price).toEqual(25.50);
    expect(typeof result.price).toBe('number'); // Verify numeric conversion
    expect(result.notes).toEqual('Sold to student for practice');
    expect(result.recorded_by).toEqual(testAdminUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save material distribution to database', async () => {
    const result = await createMaterialDistribution(testCharityInput);

    // Query using proper drizzle syntax
    const distributions = await db.select()
      .from(materialDistributionsTable)
      .where(eq(materialDistributionsTable.id, result.id))
      .execute();

    expect(distributions).toHaveLength(1);
    expect(distributions[0].material_type).toEqual('quran');
    expect(distributions[0].item_name).toEqual('Al-Quran Mushaf Madinah');
    expect(distributions[0].quantity).toEqual(10);
    expect(distributions[0].is_sale).toBe(false);
    expect(distributions[0].price).toBeNull();
    expect(distributions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different material types correctly', async () => {
    const otherMaterialInput = {
      ...testCharityInput,
      material_type: 'other' as const,
      item_name: 'Prayer Beads',
      quantity: 20,
    };

    const result = await createMaterialDistribution(otherMaterialInput);

    expect(result.material_type).toEqual('other');
    expect(result.item_name).toEqual('Prayer Beads');
    expect(result.quantity).toEqual(20);
  });

  it('should throw error for invalid study center', async () => {
    const invalidInput = {
      ...testCharityInput,
      study_center_id: 99999,
    };

    await expect(createMaterialDistribution(invalidInput))
      .rejects.toThrow(/study center not found/i);
  });

  it('should throw error for inactive study center', async () => {
    // Deactivate the study center
    await db.update(studyCentersTable)
      .set({ is_active: false })
      .where(eq(studyCentersTable.id, testStudyCenterId))
      .execute();

    await expect(createMaterialDistribution(testCharityInput))
      .rejects.toThrow(/study center not found or inactive/i);
  });

  it('should throw error for invalid recorded_by user', async () => {
    const invalidInput = {
      ...testCharityInput,
      recorded_by: 99999,
    };

    await expect(createMaterialDistribution(invalidInput))
      .rejects.toThrow(/recording user not found/i);
  });

  it('should throw error for inactive recorded_by user', async () => {
    // Deactivate the recording user
    await db.update(usersTable)
      .set({ is_active: false })
      .where(eq(usersTable.id, testAdminUserId))
      .execute();

    await expect(createMaterialDistribution(testCharityInput))
      .rejects.toThrow(/recording user not found or inactive/i);
  });

  it('should throw error for invalid recipient', async () => {
    const invalidInput = {
      ...testSaleInput,
      recipient_id: 99999,
    };

    await expect(createMaterialDistribution(invalidInput))
      .rejects.toThrow(/recipient not found/i);
  });

  it('should throw error for inactive recipient', async () => {
    // Deactivate the recipient user
    await db.update(usersTable)
      .set({ is_active: false })
      .where(eq(usersTable.id, testRecipientUserId))
      .execute();

    await expect(createMaterialDistribution(testSaleInput))
      .rejects.toThrow(/recipient not found or inactive/i);
  });

  it('should throw error for sale without price', async () => {
    const invalidInput = {
      ...testSaleInput,
      price: null,
    };

    await expect(createMaterialDistribution(invalidInput))
      .rejects.toThrow(/price must be provided and positive for sales/i);
  });

  it('should throw error for sale with zero price', async () => {
    const invalidInput = {
      ...testSaleInput,
      price: 0,
    };

    await expect(createMaterialDistribution(invalidInput))
      .rejects.toThrow(/price must be provided and positive for sales/i);
  });

  it('should throw error for sale with negative price', async () => {
    const invalidInput = {
      ...testSaleInput,
      price: -10.50,
    };

    await expect(createMaterialDistribution(invalidInput))
      .rejects.toThrow(/price must be provided and positive for sales/i);
  });

  it('should throw error for charity with price', async () => {
    const invalidInput = {
      ...testCharityInput,
      price: 15.00,
    };

    await expect(createMaterialDistribution(invalidInput))
      .rejects.toThrow(/price should not be provided for non-sale distributions/i);
  });

  it('should handle distribution without recipient for charity', async () => {
    const result = await createMaterialDistribution(testCharityInput);

    expect(result.recipient_id).toBeNull();
    expect(result.is_sale).toBe(false);
    expect(result.price).toBeNull();
  });

  it('should handle distribution with decimal prices correctly', async () => {
    const decimalPriceInput = {
      ...testSaleInput,
      price: 12.99,
    };

    const result = await createMaterialDistribution(decimalPriceInput);

    expect(result.price).toEqual(12.99);
    expect(typeof result.price).toBe('number');

    // Verify it was stored and retrieved correctly from database
    const distributions = await db.select()
      .from(materialDistributionsTable)
      .where(eq(materialDistributionsTable.id, result.id))
      .execute();

    expect(parseFloat(distributions[0].price!)).toEqual(12.99);
  });
});
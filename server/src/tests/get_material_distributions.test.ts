import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, materialDistributionsTable } from '../db/schema';
import { getMaterialDistributions, type GetMaterialDistributionsInput } from '../handlers/get_material_distributions';

describe('getMaterialDistributions', () => {
  let testUserId: number;
  let testStudyCenterId1: number;
  let testStudyCenterId2: number;
  let distributionId1: number;
  let distributionId2: number;
  let distributionId3: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      full_name: 'Test User',
      role: 'administrator',
    }).returning();
    testUserId = userResult[0].id;

    // Create test study centers
    const studyCenter1Result = await db.insert(studyCentersTable).values({
      name: 'Study Center 1',
      address: '123 Test Street',
      admin_id: testUserId,
    }).returning();
    testStudyCenterId1 = studyCenter1Result[0].id;

    const studyCenter2Result = await db.insert(studyCentersTable).values({
      name: 'Study Center 2',
      address: '456 Test Avenue',
      admin_id: testUserId,
    }).returning();
    testStudyCenterId2 = studyCenter2Result[0].id;

    // Create test material distributions with proper date strings
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0]; 
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    const distribution1Result = await db.insert(materialDistributionsTable).values({
      study_center_id: testStudyCenterId1,
      material_type: 'quran',
      item_name: 'Al-Quran Mushaf',
      quantity: 10,
      distribution_date: todayStr,
      is_sale: false,
      price: null,
      notes: 'Free distribution',
      recorded_by: testUserId,
    }).returning();
    distributionId1 = distribution1Result[0].id;

    const distribution2Result = await db.insert(materialDistributionsTable).values({
      study_center_id: testStudyCenterId1,
      material_type: 'notebook',
      item_name: 'Exercise Book',
      quantity: 25,
      distribution_date: yesterdayStr,
      is_sale: true,
      price: '15.50',
      notes: 'Sold to students',
      recorded_by: testUserId,
    }).returning();
    distributionId2 = distribution2Result[0].id;

    const distribution3Result = await db.insert(materialDistributionsTable).values({
      study_center_id: testStudyCenterId2,
      material_type: 'other',
      item_name: 'Pen Set',
      quantity: 50,
      distribution_date: lastWeekStr,
      is_sale: true,
      price: '8.99',
      notes: 'Stationery sale',
      recorded_by: testUserId,
    }).returning();
    distributionId3 = distribution3Result[0].id;
  });

  afterEach(resetDB);

  it('should fetch all material distributions with default parameters', async () => {
    const input: GetMaterialDistributionsInput = {};
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(3);
    // Verify we got all distributions (order will be by creation time, desc)
    expect(result.map(r => r.id).sort()).toEqual([distributionId1, distributionId2, distributionId3].sort());
    
    // Verify all fields are present
    const distribution = result[0];
    expect(distribution.study_center_id).toBeDefined();
    expect(distribution.material_type).toBeDefined();
    expect(distribution.item_name).toBeDefined();
    expect(distribution.quantity).toBeDefined();
    expect(distribution.distribution_date).toBeInstanceOf(Date);
    expect(distribution.is_sale).toBeDefined();
    expect(distribution.recorded_by).toBeDefined();
    expect(distribution.created_at).toBeInstanceOf(Date);
  });

  it('should filter by study center ID', async () => {
    const input: GetMaterialDistributionsInput = {
      study_center_id: testStudyCenterId1,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(2);
    result.forEach(distribution => {
      expect(distribution.study_center_id).toBe(testStudyCenterId1);
    });
  });

  it('should filter by material type', async () => {
    const input: GetMaterialDistributionsInput = {
      material_type: 'quran',
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(1);
    expect(result[0].material_type).toBe('quran');
    expect(result[0].item_name).toBe('Al-Quran Mushaf');
  });

  it('should filter by date range', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const input: GetMaterialDistributionsInput = {
      date_from: yesterday,
      date_to: today,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(2);
    result.forEach(distribution => {
      const distribDate = distribution.distribution_date.toISOString().split('T')[0];
      expect(distribDate >= yesterdayStr).toBe(true);
      expect(distribDate <= todayStr).toBe(true);
    });
  });

  it('should filter by is_sale status', async () => {
    const input: GetMaterialDistributionsInput = {
      is_sale: true,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(2);
    result.forEach(distribution => {
      expect(distribution.is_sale).toBe(true);
      expect(distribution.price).toBeGreaterThan(0);
    });
  });

  it('should filter by is_sale false (free distributions)', async () => {
    const input: GetMaterialDistributionsInput = {
      is_sale: false,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(1);
    expect(result[0].is_sale).toBe(false);
    expect(result[0].price).toBe(null);
  });

  it('should apply multiple filters correctly', async () => {
    const input: GetMaterialDistributionsInput = {
      study_center_id: testStudyCenterId1,
      is_sale: true,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(1);
    expect(result[0].study_center_id).toBe(testStudyCenterId1);
    expect(result[0].is_sale).toBe(true);
    expect(result[0].material_type).toBe('notebook');
  });

  it('should handle pagination with limit', async () => {
    const input: GetMaterialDistributionsInput = {
      limit: 2,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(2);
  });

  it('should handle pagination with offset', async () => {
    const input: GetMaterialDistributionsInput = {
      limit: 2,
      offset: 1,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(2);
    // Should skip the first distribution in the ordered results
    expect(result.length).toBe(2);
  });

  it('should convert numeric price fields correctly', async () => {
    const input: GetMaterialDistributionsInput = {
      is_sale: true,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(2);
    result.forEach(distribution => {
      expect(typeof distribution.price).toBe('number');
      expect(distribution.price).toBeGreaterThan(0);
    });
    
    // Check specific values
    const notebookDistribution = result.find(d => d.material_type === 'notebook');
    const penDistribution = result.find(d => d.material_type === 'other');
    
    expect(notebookDistribution?.price).toBe(15.50);
    expect(penDistribution?.price).toBe(8.99);
  });

  it('should handle null price values correctly', async () => {
    const input: GetMaterialDistributionsInput = {
      is_sale: false,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(null);
  });

  it('should return empty array when no distributions match filters', async () => {
    const input: GetMaterialDistributionsInput = {
      material_type: 'quran',
      is_sale: true, // No quran distributions are sales
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(0);
  });

  it('should order results by creation date descending', async () => {
    const input: GetMaterialDistributionsInput = {};
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(3);
    // Results should be ordered from most recent to oldest created_at
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(result[i + 1].created_at.getTime());
    }
  });

  it('should handle date_from filter correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const input: GetMaterialDistributionsInput = {
      date_from: yesterday,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(2);
    result.forEach(distribution => {
      const distribDate = distribution.distribution_date.toISOString().split('T')[0];
      expect(distribDate >= yesterdayStr).toBe(true);
    });
  });

  it('should handle date_to filter correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const input: GetMaterialDistributionsInput = {
      date_to: yesterday,
    };
    
    const result = await getMaterialDistributions(input);

    expect(result).toHaveLength(2);
    result.forEach(distribution => {
      const distribDate = distribution.distribution_date.toISOString().split('T')[0];
      expect(distribDate <= yesterdayStr).toBe(true);
    });
  });
});
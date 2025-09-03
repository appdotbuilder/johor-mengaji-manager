import { db } from '../db';
import { materialDistributionsTable } from '../db/schema';
import { type MaterialDistribution, materialTypeSchema } from '../schema';
import { eq, gte, lte, and, desc, type SQL } from 'drizzle-orm';
import { z } from 'zod';

// Input schema for filtering material distributions
const getMaterialDistributionsInputSchema = z.object({
  study_center_id: z.number().optional(),
  material_type: materialTypeSchema.optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  is_sale: z.boolean().optional(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type GetMaterialDistributionsInput = z.input<typeof getMaterialDistributionsInputSchema>;

export const getMaterialDistributions = async (input: GetMaterialDistributionsInput = {}): Promise<MaterialDistribution[]> => {
  // Parse input with defaults
  const parsedInput = getMaterialDistributionsInputSchema.parse(input);
  
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (parsedInput.study_center_id !== undefined) {
      conditions.push(eq(materialDistributionsTable.study_center_id, parsedInput.study_center_id));
    }

    if (parsedInput.material_type) {
      conditions.push(eq(materialDistributionsTable.material_type, parsedInput.material_type));
    }

    if (parsedInput.date_from) {
      const dateString = parsedInput.date_from.toISOString().split('T')[0];
      conditions.push(gte(materialDistributionsTable.distribution_date, dateString));
    }

    if (parsedInput.date_to) {
      const dateString = parsedInput.date_to.toISOString().split('T')[0];
      conditions.push(lte(materialDistributionsTable.distribution_date, dateString));
    }

    if (parsedInput.is_sale !== undefined) {
      conditions.push(eq(materialDistributionsTable.is_sale, parsedInput.is_sale));
    }

    // Build the query
    const baseQuery = db.select().from(materialDistributionsTable);
    
    // Apply conditions if any exist
    const queryWithWhere = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Execute query with ordering and pagination
    const results = await queryWithWhere
      .orderBy(desc(materialDistributionsTable.created_at))
      .limit(parsedInput.limit)
      .offset(parsedInput.offset);

    // Convert fields to proper types
    return results.map(distribution => ({
      ...distribution,
      price: distribution.price ? parseFloat(distribution.price) : null,
      distribution_date: new Date(distribution.distribution_date),
      created_at: new Date(distribution.created_at),
    }));
  } catch (error) {
    console.error('Failed to fetch material distributions:', error);
    throw error;
  }
};
import { db } from '../db';
import { materialDistributionsTable, studyCentersTable, usersTable } from '../db/schema';
import { type CreateMaterialDistributionInput, type MaterialDistribution } from '../schema';
import { eq } from 'drizzle-orm';

export async function createMaterialDistribution(input: CreateMaterialDistributionInput): Promise<MaterialDistribution> {
  try {
    // Validate study center exists and is active
    const studyCenter = await db.select()
      .from(studyCentersTable)
      .where(eq(studyCentersTable.id, input.study_center_id))
      .execute();

    if (studyCenter.length === 0 || !studyCenter[0].is_active) {
      throw new Error('Study center not found or inactive');
    }

    // Validate recorded_by user exists and is active
    const recordedByUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.recorded_by))
      .execute();

    if (recordedByUser.length === 0 || !recordedByUser[0].is_active) {
      throw new Error('Recording user not found or inactive');
    }

    // If recipient_id is provided, validate the recipient exists and is active
    if (input.recipient_id) {
      const recipient = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.recipient_id))
        .execute();

      if (recipient.length === 0 || !recipient[0].is_active) {
        throw new Error('Recipient not found or inactive');
      }
    }

    // Validate business logic: if is_sale is true, price must be provided and positive
    if (input.is_sale && (!input.price || input.price <= 0)) {
      throw new Error('Price must be provided and positive for sales');
    }

    // Validate business logic: if is_sale is false, price should not be provided
    if (!input.is_sale && input.price) {
      throw new Error('Price should not be provided for non-sale distributions');
    }

    // Insert material distribution record
    const result = await db.insert(materialDistributionsTable)
      .values({
        study_center_id: input.study_center_id,
        material_type: input.material_type,
        item_name: input.item_name,
        quantity: input.quantity,
        recipient_id: input.recipient_id,
        distribution_date: input.distribution_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        is_sale: input.is_sale,
        price: input.price ? input.price.toString() : null, // Convert number to string for numeric column
        notes: input.notes,
        recorded_by: input.recorded_by,
      })
      .returning()
      .execute();

    // Convert fields to proper types before returning
    const distribution = result[0];
    return {
      ...distribution,
      distribution_date: new Date(distribution.distribution_date), // Convert string back to Date
      price: distribution.price ? parseFloat(distribution.price) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Material distribution creation failed:', error);
    throw error;
  }
}
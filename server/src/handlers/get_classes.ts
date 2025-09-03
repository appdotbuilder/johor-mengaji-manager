import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';

export const getClasses = async (): Promise<Class[]> => {
  try {
    const results = await db.select()
      .from(classesTable)
      .execute();

    // No numeric conversions needed for classes table
    return results.map(result => ({
      ...result,
      // Ensure dates are Date objects
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};
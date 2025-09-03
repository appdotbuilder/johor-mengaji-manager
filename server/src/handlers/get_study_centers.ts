import { db } from '../db';
import { studyCentersTable } from '../db/schema';
import { type StudyCenter } from '../schema';
import { eq } from 'drizzle-orm';

export const getStudyCenters = async (): Promise<StudyCenter[]> => {
  try {
    // Fetch all active study centers
    const results = await db.select()
      .from(studyCentersTable)
      .where(eq(studyCentersTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch study centers:', error);
    throw error;
  }
};
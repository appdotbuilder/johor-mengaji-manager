import { db } from '../db';
import { studyCentersTable, usersTable } from '../db/schema';
import { type CreateStudyCenterInput, type StudyCenter } from '../schema';
import { eq } from 'drizzle-orm';

export const createStudyCenter = async (input: CreateStudyCenterInput): Promise<StudyCenter> => {
  try {
    // Validate that the admin user exists
    const adminUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.admin_id))
      .execute();

    if (adminUser.length === 0) {
      throw new Error(`Admin user with id ${input.admin_id} not found`);
    }

    // Insert study center record
    const result = await db.insert(studyCentersTable)
      .values({
        name: input.name,
        address: input.address,
        phone: input.phone,
        email: input.email,
        registration_number: input.registration_number,
        admin_id: input.admin_id,
        is_active: true
      })
      .returning()
      .execute();

    const studyCenter = result[0];
    return studyCenter;
  } catch (error) {
    console.error('Study center creation failed:', error);
    throw error;
  }
};
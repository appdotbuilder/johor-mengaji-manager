import { db } from '../db';
import { videosTable, studyCentersTable, usersTable } from '../db/schema';
import { type CreateVideoInput, type Video } from '../schema';
import { eq } from 'drizzle-orm';

export const createVideo = async (input: CreateVideoInput): Promise<Video> => {
  try {
    // Validate that the study center exists and is active
    const studyCenter = await db.select()
      .from(studyCentersTable)
      .where(eq(studyCentersTable.id, input.study_center_id))
      .execute();

    if (studyCenter.length === 0 || !studyCenter[0].is_active) {
      throw new Error('Study center not found or inactive');
    }

    // Validate that the user exists and is active
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.uploaded_by))
      .execute();

    if (user.length === 0 || !user[0].is_active) {
      throw new Error('User not found or inactive');
    }

    // Insert video record
    const result = await db.insert(videosTable)
      .values({
        study_center_id: input.study_center_id,
        title: input.title,
        description: input.description,
        file_url: input.file_url,
        duration: input.duration,
        uploaded_by: input.uploaded_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Video creation failed:', error);
    throw error;
  }
};
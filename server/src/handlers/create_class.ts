import { db } from '../db';
import { classesTable, studyCentersTable, teachersTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createClass(input: CreateClassInput): Promise<Class> {
  try {
    // Validate that study center exists and is active
    const studyCenter = await db.select()
      .from(studyCentersTable)
      .where(
        and(
          eq(studyCentersTable.id, input.study_center_id),
          eq(studyCentersTable.is_active, true)
        )
      )
      .execute();

    if (studyCenter.length === 0) {
      throw new Error('Study center not found or inactive');
    }

    // Validate that teacher exists, is active, and belongs to the study center
    const teacher = await db.select()
      .from(teachersTable)
      .where(
        and(
          eq(teachersTable.id, input.teacher_id),
          eq(teachersTable.study_center_id, input.study_center_id),
          eq(teachersTable.is_active, true)
        )
      )
      .execute();

    if (teacher.length === 0) {
      throw new Error('Teacher not found, inactive, or does not belong to the study center');
    }

    // Check for schedule conflicts - same teacher, same day, overlapping times
    const conflictingClasses = await db.select()
      .from(classesTable)
      .where(
        and(
          eq(classesTable.teacher_id, input.teacher_id),
          eq(classesTable.schedule_day, input.schedule_day),
          eq(classesTable.is_active, true)
        )
      )
      .execute();

    // Check for time overlaps
    for (const existingClass of conflictingClasses) {
      const existingStart = existingClass.start_time;
      const existingEnd = existingClass.end_time;
      const newStart = input.start_time;
      const newEnd = input.end_time;

      // Check if times overlap
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        throw new Error('Teacher has a scheduling conflict with an existing class');
      }
    }

    // Insert the new class
    const result = await db.insert(classesTable)
      .values({
        study_center_id: input.study_center_id,
        name: input.name,
        description: input.description,
        class_type: input.class_type,
        teacher_id: input.teacher_id,
        schedule_day: input.schedule_day,
        start_time: input.start_time,
        end_time: input.end_time,
        max_students: input.max_students,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
}
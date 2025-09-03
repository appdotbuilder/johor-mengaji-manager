import { db } from '../db';
import { teachersTable, usersTable, studyCentersTable } from '../db/schema';
import { type CreateTeacherInput, type Teacher } from '../schema';
import { eq } from 'drizzle-orm';

export const createTeacher = async (input: CreateTeacherInput): Promise<Teacher> => {
  try {
    // Validate user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Validate study center exists
    const studyCenter = await db.select()
      .from(studyCentersTable)
      .where(eq(studyCentersTable.id, input.study_center_id))
      .execute();

    if (studyCenter.length === 0) {
      throw new Error(`Study center with id ${input.study_center_id} does not exist`);
    }

    // Check if IC number is unique
    const existingTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.ic_number, input.ic_number))
      .execute();

    if (existingTeacher.length > 0) {
      throw new Error(`Teacher with IC number ${input.ic_number} already exists`);
    }

    // Insert teacher record - convert Date objects to strings for database
    const insertValues = {
      user_id: input.user_id,
      study_center_id: input.study_center_id,
      ic_number: input.ic_number,
      date_of_birth: input.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      address: input.address,
      qualifications: input.qualifications,
      jaij_permit_number: input.jaij_permit_number,
      jaij_permit_expiry: input.jaij_permit_expiry ? input.jaij_permit_expiry.toISOString().split('T')[0] : null
    };

    const result = await db.insert(teachersTable)
      .values(insertValues)
      .returning()
      .execute();

    // Convert date fields back to Date objects for return
    const teacher = result[0];
    return {
      ...teacher,
      date_of_birth: new Date(teacher.date_of_birth),
      jaij_permit_expiry: teacher.jaij_permit_expiry ? new Date(teacher.jaij_permit_expiry) : null
    };
  } catch (error) {
    console.error('Teacher creation failed:', error);
    throw error;
  }
};
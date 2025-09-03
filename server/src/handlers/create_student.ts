import { db } from '../db';
import { studentsTable, usersTable, studyCentersTable } from '../db/schema';
import { type CreateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const createStudent = async (input: CreateStudentInput): Promise<Student> => {
  try {
    // Validate that user exists and has 'pelajar' role
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with ID ${input.user_id} not found`);
    }

    if (user[0].role !== 'pelajar') {
      throw new Error(`User must have 'pelajar' role to create student profile`);
    }

    // Validate that study center exists
    const studyCenter = await db.select()
      .from(studyCentersTable)
      .where(eq(studyCentersTable.id, input.study_center_id))
      .execute();

    if (studyCenter.length === 0) {
      throw new Error(`Study center with ID ${input.study_center_id} not found`);
    }

    // Check if student profile already exists for this user
    const existingStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.user_id, input.user_id))
      .execute();

    if (existingStudent.length > 0) {
      throw new Error(`Student profile already exists for user ID ${input.user_id}`);
    }

    // Check if IC number is already in use
    const existingIC = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.ic_number, input.ic_number))
      .execute();

    if (existingIC.length > 0) {
      throw new Error(`IC number ${input.ic_number} is already registered`);
    }

    // Insert student record
    const result = await db.insert(studentsTable)
      .values({
        user_id: input.user_id,
        study_center_id: input.study_center_id,
        ic_number: input.ic_number,
        date_of_birth: input.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        address: input.address,
        parent_name: input.parent_name,
        parent_phone: input.parent_phone,
        emergency_contact: input.emergency_contact,
      })
      .returning()
      .execute();

    // Convert date string back to Date object before returning
    const student = result[0];
    return {
      ...student,
      date_of_birth: new Date(student.date_of_birth), // Convert string back to Date
    };
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
};
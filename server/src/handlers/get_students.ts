import { db } from '../db';
import { studentsTable, usersTable, studyCentersTable } from '../db/schema';
import { type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const getStudents = async (): Promise<Student[]> => {
  try {
    // Join students with their user and study center data
    const results = await db.select({
      id: studentsTable.id,
      user_id: studentsTable.user_id,
      study_center_id: studentsTable.study_center_id,
      ic_number: studentsTable.ic_number,
      date_of_birth: studentsTable.date_of_birth,
      address: studentsTable.address,
      parent_name: studentsTable.parent_name,
      parent_phone: studentsTable.parent_phone,
      emergency_contact: studentsTable.emergency_contact,
      is_active: studentsTable.is_active,
      created_at: studentsTable.created_at,
      updated_at: studentsTable.updated_at,
    })
    .from(studentsTable)
    .innerJoin(usersTable, eq(studentsTable.user_id, usersTable.id))
    .innerJoin(studyCentersTable, eq(studentsTable.study_center_id, studyCentersTable.id))
    .execute();

    // Convert date strings to Date objects to match schema
    return results.map(student => ({
      ...student,
      date_of_birth: new Date(student.date_of_birth),
    }));
  } catch (error) {
    console.error('Failed to fetch students:', error);
    throw error;
  }
};
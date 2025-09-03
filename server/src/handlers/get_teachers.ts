import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type Teacher } from '../schema';

export const getTeachers = async (): Promise<Teacher[]> => {
  try {
    const results = await db.select()
      .from(teachersTable)
      .execute();

    return results.map(teacher => ({
      ...teacher,
      // Convert date strings to Date objects for consistency with schema
      date_of_birth: new Date(teacher.date_of_birth),
      jaij_permit_expiry: teacher.jaij_permit_expiry ? new Date(teacher.jaij_permit_expiry) : null,
      created_at: teacher.created_at,
      updated_at: teacher.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    throw error;
  }
};
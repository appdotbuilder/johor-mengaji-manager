import { db } from '../db';
import { attendanceTable } from '../db/schema';
import { type GetAttendanceByClassInput, type Attendance } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export const getAttendanceByClass = async (input: GetAttendanceByClassInput): Promise<Attendance[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by class_id
    conditions.push(eq(attendanceTable.class_id, input.class_id));

    // Add optional date range filtering
    if (input.date_from) {
      const dateFromString = input.date_from.toISOString().split('T')[0];
      conditions.push(gte(attendanceTable.date, dateFromString));
    }

    if (input.date_to) {
      const dateToString = input.date_to.toISOString().split('T')[0];
      conditions.push(lte(attendanceTable.date, dateToString));
    }

    // Build and execute query
    const results = await db.select()
      .from(attendanceTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Convert date strings back to Date objects for the schema
    return results.map(result => ({
      ...result,
      date: new Date(result.date),
      recorded_at: result.recorded_at
    }));
  } catch (error) {
    console.error('Failed to fetch attendance by class:', error);
    throw error;
  }
};
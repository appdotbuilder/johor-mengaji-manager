import { db } from '../db';
import { attendanceTable, classEnrollmentsTable, classesTable, studentsTable } from '../db/schema';
import { type CreateAttendanceInput, type Attendance } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createAttendance = async (input: CreateAttendanceInput): Promise<Attendance> => {
  try {
    // First, verify that the student is enrolled in the specified class
    const enrollment = await db.select()
      .from(classEnrollmentsTable)
      .where(
        and(
          eq(classEnrollmentsTable.class_id, input.class_id),
          eq(classEnrollmentsTable.student_id, input.student_id),
          eq(classEnrollmentsTable.is_active, true)
        )
      )
      .execute();

    if (enrollment.length === 0) {
      throw new Error('Student is not enrolled in this class');
    }

    // Check if attendance record already exists for this student, class, and date
    const dateString = input.date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
    const existingAttendance = await db.select()
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.class_id, input.class_id),
          eq(attendanceTable.student_id, input.student_id),
          eq(attendanceTable.date, dateString)
        )
      )
      .execute();

    if (existingAttendance.length > 0) {
      throw new Error('Attendance record already exists for this student on this date');
    }

    // Verify that the class exists
    const classExists = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classExists.length === 0) {
      throw new Error('Class not found');
    }

    // Verify that the student exists
    const studentExists = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (studentExists.length === 0) {
      throw new Error('Student not found');
    }

    // Insert attendance record
    const result = await db.insert(attendanceTable)
      .values({
        class_id: input.class_id,
        student_id: input.student_id,
        date: dateString,
        status: input.status,
        notes: input.notes,
        recorded_by: input.recorded_by
      })
      .returning()
      .execute();

    // Convert date string back to Date object for return
    const attendance = result[0];
    return {
      ...attendance,
      date: new Date(attendance.date)
    };
  } catch (error) {
    console.error('Attendance creation failed:', error);
    throw error;
  }
};
import { db } from '../db';
import { classesTable, classEnrollmentsTable, studentsTable } from '../db/schema';
import { type ClassEnrollment } from '../schema';
import { eq, and, count } from 'drizzle-orm';

export const enrollStudent = async (classId: number, studentId: number): Promise<ClassEnrollment> => {
  try {
    // Validate that the class exists and is active
    const classResult = await db.select()
      .from(classesTable)
      .where(and(
        eq(classesTable.id, classId),
        eq(classesTable.is_active, true)
      ))
      .execute();

    if (classResult.length === 0) {
      throw new Error('Class not found or is inactive');
    }

    const classInfo = classResult[0];

    // Validate that the student exists and is active
    const studentResult = await db.select()
      .from(studentsTable)
      .where(and(
        eq(studentsTable.id, studentId),
        eq(studentsTable.is_active, true)
      ))
      .execute();

    if (studentResult.length === 0) {
      throw new Error('Student not found or is inactive');
    }

    // Check if student is already enrolled in this class (active enrollment)
    const existingEnrollment = await db.select()
      .from(classEnrollmentsTable)
      .where(and(
        eq(classEnrollmentsTable.class_id, classId),
        eq(classEnrollmentsTable.student_id, studentId),
        eq(classEnrollmentsTable.is_active, true)
      ))
      .execute();

    if (existingEnrollment.length > 0) {
      throw new Error('Student is already enrolled in this class');
    }

    // Check class capacity - count current active enrollments
    const enrollmentCountResult = await db.select({
      count: count()
    })
      .from(classEnrollmentsTable)
      .where(and(
        eq(classEnrollmentsTable.class_id, classId),
        eq(classEnrollmentsTable.is_active, true)
      ))
      .execute();

    const currentEnrollments = enrollmentCountResult[0].count;

    if (currentEnrollments >= classInfo.max_students) {
      throw new Error('Class has reached maximum capacity');
    }

    // Create the enrollment
    const result = await db.insert(classEnrollmentsTable)
      .values({
        class_id: classId,
        student_id: studentId,
        enrolled_at: new Date(),
        is_active: true
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Student enrollment failed:', error);
    throw error;
  }
};
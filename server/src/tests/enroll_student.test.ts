import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  studyCentersTable, 
  teachersTable, 
  studentsTable, 
  classesTable, 
  classEnrollmentsTable 
} from '../db/schema';
import { enrollStudent } from '../handlers/enroll_student';
import { eq } from 'drizzle-orm';

describe('enrollStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should enroll a student in a class successfully', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        phone: '123456789',
        role: 'administrator'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        phone: '123456789',
        email: 'center@test.com',
        registration_number: 'REG001',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const teacherUser = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Teacher User',
        phone: '123456789',
        role: 'pengajar_pusat'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: teacherUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1980-01-01',
        address: '456 Teacher Street',
        qualifications: 'B.Ed Islamic Studies',
        jaij_permit_number: 'JAIJ001',
        jaij_permit_expiry: '2025-12-31'
      })
      .returning()
      .execute();

    const studentUser = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Student User',
        phone: '123456789',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789013',
        date_of_birth: '2005-01-01',
        address: '789 Student Street',
        parent_name: 'Parent Name',
        parent_phone: '123456788',
        emergency_contact: '123456787'
      })
      .returning()
      .execute();

    const classInfo = await db.insert(classesTable)
      .values({
        study_center_id: studyCenter[0].id,
        name: 'Beginner Quran Class',
        description: 'Basic Quran reading class',
        class_type: 'physical',
        teacher_id: teacher[0].id,
        schedule_day: 'Monday',
        start_time: '09:00',
        end_time: '10:00',
        max_students: 10
      })
      .returning()
      .execute();

    // Enroll the student
    const result = await enrollStudent(classInfo[0].id, student[0].id);

    // Verify enrollment details
    expect(result.class_id).toEqual(classInfo[0].id);
    expect(result.student_id).toEqual(student[0].id);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.enrolled_at).toBeInstanceOf(Date);
  });

  it('should save enrollment to database', async () => {
    // Create prerequisite data (simplified)
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        phone: '123456789',
        role: 'administrator'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const teacherUser = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Teacher User',
        role: 'pengajar_pusat'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: teacherUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1980-01-01',
        address: '456 Teacher Street'
      })
      .returning()
      .execute();

    const studentUser = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Student User',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789013',
        date_of_birth: '2005-01-01',
        address: '789 Student Street'
      })
      .returning()
      .execute();

    const classInfo = await db.insert(classesTable)
      .values({
        study_center_id: studyCenter[0].id,
        name: 'Test Class',
        class_type: 'physical',
        teacher_id: teacher[0].id,
        schedule_day: 'Monday',
        start_time: '09:00',
        end_time: '10:00',
        max_students: 10
      })
      .returning()
      .execute();

    const result = await enrollStudent(classInfo[0].id, student[0].id);

    // Verify enrollment was saved to database
    const enrollments = await db.select()
      .from(classEnrollmentsTable)
      .where(eq(classEnrollmentsTable.id, result.id))
      .execute();

    expect(enrollments).toHaveLength(1);
    expect(enrollments[0].class_id).toEqual(classInfo[0].id);
    expect(enrollments[0].student_id).toEqual(student[0].id);
    expect(enrollments[0].is_active).toEqual(true);
    expect(enrollments[0].enrolled_at).toBeInstanceOf(Date);
  });

  it('should throw error when class does not exist', async () => {
    const nonExistentClassId = 999;
    const nonExistentStudentId = 999;

    await expect(enrollStudent(nonExistentClassId, nonExistentStudentId))
      .rejects.toThrow(/class not found or is inactive/i);
  });

  it('should throw error when class is inactive', async () => {
    // Create prerequisite data with inactive class
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'administrator'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const teacherUser = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Teacher User',
        role: 'pengajar_pusat'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: teacherUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1980-01-01',
        address: '456 Teacher Street'
      })
      .returning()
      .execute();

    const studentUser = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Student User',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789013',
        date_of_birth: '2005-01-01',
        address: '789 Student Street'
      })
      .returning()
      .execute();

    // Create inactive class
    const classInfo = await db.insert(classesTable)
      .values({
        study_center_id: studyCenter[0].id,
        name: 'Inactive Class',
        class_type: 'physical',
        teacher_id: teacher[0].id,
        schedule_day: 'Monday',
        start_time: '09:00',
        end_time: '10:00',
        max_students: 10,
        is_active: false // Inactive class
      })
      .returning()
      .execute();

    await expect(enrollStudent(classInfo[0].id, student[0].id))
      .rejects.toThrow(/class not found or is inactive/i);
  });

  it('should throw error when student does not exist', async () => {
    // Create class but no student
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'administrator'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const teacherUser = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Teacher User',
        role: 'pengajar_pusat'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: teacherUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1980-01-01',
        address: '456 Teacher Street'
      })
      .returning()
      .execute();

    const classInfo = await db.insert(classesTable)
      .values({
        study_center_id: studyCenter[0].id,
        name: 'Test Class',
        class_type: 'physical',
        teacher_id: teacher[0].id,
        schedule_day: 'Monday',
        start_time: '09:00',
        end_time: '10:00',
        max_students: 10
      })
      .returning()
      .execute();

    const nonExistentStudentId = 999;

    await expect(enrollStudent(classInfo[0].id, nonExistentStudentId))
      .rejects.toThrow(/student not found or is inactive/i);
  });

  it('should throw error when student is already enrolled', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'administrator'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const teacherUser = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Teacher User',
        role: 'pengajar_pusat'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: teacherUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1980-01-01',
        address: '456 Teacher Street'
      })
      .returning()
      .execute();

    const studentUser = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Student User',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789013',
        date_of_birth: '2005-01-01',
        address: '789 Student Street'
      })
      .returning()
      .execute();

    const classInfo = await db.insert(classesTable)
      .values({
        study_center_id: studyCenter[0].id,
        name: 'Test Class',
        class_type: 'physical',
        teacher_id: teacher[0].id,
        schedule_day: 'Monday',
        start_time: '09:00',
        end_time: '10:00',
        max_students: 10
      })
      .returning()
      .execute();

    // First enrollment should succeed
    await enrollStudent(classInfo[0].id, student[0].id);

    // Second enrollment should fail
    await expect(enrollStudent(classInfo[0].id, student[0].id))
      .rejects.toThrow(/student is already enrolled in this class/i);
  });

  it('should throw error when class has reached maximum capacity', async () => {
    // Create prerequisite data with max_students = 1
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'administrator'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const teacherUser = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Teacher User',
        role: 'pengajar_pusat'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: teacherUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1980-01-01',
        address: '456 Teacher Street'
      })
      .returning()
      .execute();

    // Create two students
    const student1User = await db.insert(usersTable)
      .values({
        email: 'student1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Student One',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student1 = await db.insert(studentsTable)
      .values({
        user_id: student1User[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789013',
        date_of_birth: '2005-01-01',
        address: '789 Student Street'
      })
      .returning()
      .execute();

    const student2User = await db.insert(usersTable)
      .values({
        email: 'student2@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Student Two',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student2 = await db.insert(studentsTable)
      .values({
        user_id: student2User[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789014',
        date_of_birth: '2005-01-01',
        address: '790 Student Street'
      })
      .returning()
      .execute();

    // Create class with max capacity of 1
    const classInfo = await db.insert(classesTable)
      .values({
        study_center_id: studyCenter[0].id,
        name: 'Small Class',
        class_type: 'physical',
        teacher_id: teacher[0].id,
        schedule_day: 'Monday',
        start_time: '09:00',
        end_time: '10:00',
        max_students: 1 // Only 1 student allowed
      })
      .returning()
      .execute();

    // First student should enroll successfully
    await enrollStudent(classInfo[0].id, student1[0].id);

    // Second student should fail due to capacity
    await expect(enrollStudent(classInfo[0].id, student2[0].id))
      .rejects.toThrow(/class has reached maximum capacity/i);
  });

  it('should allow enrollment after inactive enrollment exists', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'administrator'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const teacherUser = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Teacher User',
        role: 'pengajar_pusat'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: teacherUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1980-01-01',
        address: '456 Teacher Street'
      })
      .returning()
      .execute();

    const studentUser = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Student User',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789013',
        date_of_birth: '2005-01-01',
        address: '789 Student Street'
      })
      .returning()
      .execute();

    const classInfo = await db.insert(classesTable)
      .values({
        study_center_id: studyCenter[0].id,
        name: 'Test Class',
        class_type: 'physical',
        teacher_id: teacher[0].id,
        schedule_day: 'Monday',
        start_time: '09:00',
        end_time: '10:00',
        max_students: 10
      })
      .returning()
      .execute();

    // Create an inactive enrollment first
    await db.insert(classEnrollmentsTable)
      .values({
        class_id: classInfo[0].id,
        student_id: student[0].id,
        is_active: false // Inactive enrollment
      })
      .execute();

    // New enrollment should succeed (only checks active enrollments)
    const result = await enrollStudent(classInfo[0].id, student[0].id);

    expect(result.class_id).toEqual(classInfo[0].id);
    expect(result.student_id).toEqual(student[0].id);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
  });
});
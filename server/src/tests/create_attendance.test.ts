import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  studyCentersTable, 
  teachersTable, 
  studentsTable, 
  classesTable, 
  classEnrollmentsTable, 
  attendanceTable 
} from '../db/schema';
import { type CreateAttendanceInput } from '../schema';
import { createAttendance } from '../handlers/create_attendance';
import { eq, and } from 'drizzle-orm';

describe('createAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let testUser: any;
  let testStudyCenter: any;
  let testTeacher: any;
  let testStudent: any;
  let testClass: any;

  beforeEach(async () => {
    // Create test user for admin
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Admin',
        phone: '+60123456789',
        role: 'administrator',
        is_active: true
      })
      .returning()
      .execute();

    // Create test user for student
    testUser = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Student',
        phone: '+60123456788',
        role: 'pelajar',
        is_active: true
      })
      .returning()
      .execute();

    // Create test user for teacher
    const teacherUser = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Teacher',
        phone: '+60123456787',
        role: 'pengajar_pusat',
        is_active: true
      })
      .returning()
      .execute();

    // Create study center
    testStudyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        phone: '+60123456786',
        email: 'center@test.com',
        registration_number: 'REG123',
        admin_id: adminUser[0].id,
        is_active: true
      })
      .returning()
      .execute();

    // Create teacher
    testTeacher = await db.insert(teachersTable)
      .values({
        user_id: teacherUser[0].id,
        study_center_id: testStudyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1990-01-01',
        address: '456 Teacher Street',
        qualifications: 'Bachelor of Education',
        jaij_permit_number: 'JAIJ123',
        jaij_permit_expiry: '2025-12-31',
        is_active: true
      })
      .returning()
      .execute();

    // Create student
    testStudent = await db.insert(studentsTable)
      .values({
        user_id: testUser[0].id,
        study_center_id: testStudyCenter[0].id,
        ic_number: '123456789013',
        date_of_birth: '2005-01-01',
        address: '789 Student Street',
        parent_name: 'Parent Name',
        parent_phone: '+60123456785',
        emergency_contact: '+60123456784',
        is_active: true
      })
      .returning()
      .execute();

    // Create class
    testClass = await db.insert(classesTable)
      .values({
        study_center_id: testStudyCenter[0].id,
        name: 'Test Class',
        description: 'A class for testing',
        class_type: 'physical',
        teacher_id: testTeacher[0].id,
        schedule_day: 'Monday',
        start_time: '09:00',
        end_time: '11:00',
        max_students: 20,
        is_active: true
      })
      .returning()
      .execute();

    // Enroll student in class
    await db.insert(classEnrollmentsTable)
      .values({
        class_id: testClass[0].id,
        student_id: testStudent[0].id,
        is_active: true
      })
      .execute();
  });

  const testInput: CreateAttendanceInput = {
    class_id: 0, // Will be set in tests
    student_id: 0, // Will be set in tests
    date: new Date('2024-01-15'),
    status: 'present',
    notes: 'Student was present and participated well',
    recorded_by: 0 // Will be set in tests
  };

  it('should create attendance record successfully', async () => {
    const input = {
      ...testInput,
      class_id: testClass[0].id,
      student_id: testStudent[0].id,
      recorded_by: testTeacher[0].id
    };

    const result = await createAttendance(input);

    // Verify basic fields
    expect(result.class_id).toEqual(testClass[0].id);
    expect(result.student_id).toEqual(testStudent[0].id);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.status).toEqual('present');
    expect(result.notes).toEqual('Student was present and participated well');
    expect(result.recorded_by).toEqual(testTeacher[0].id);
    expect(result.id).toBeDefined();
    expect(result.recorded_at).toBeInstanceOf(Date);
  });

  it('should save attendance record to database', async () => {
    const input = {
      ...testInput,
      class_id: testClass[0].id,
      student_id: testStudent[0].id,
      recorded_by: testTeacher[0].id
    };

    const result = await createAttendance(input);

    // Query database to verify record was saved
    const savedAttendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, result.id))
      .execute();

    expect(savedAttendance).toHaveLength(1);
    expect(savedAttendance[0].class_id).toEqual(testClass[0].id);
    expect(savedAttendance[0].student_id).toEqual(testStudent[0].id);
    expect(savedAttendance[0].status).toEqual('present');
    expect(savedAttendance[0].notes).toEqual('Student was present and participated well');
  });

  it('should create attendance with different statuses', async () => {
    const statuses = ['present', 'absent', 'late'] as const;
    
    for (const status of statuses) {
      const input = {
        ...testInput,
        class_id: testClass[0].id,
        student_id: testStudent[0].id,
        recorded_by: testTeacher[0].id,
        status,
        date: new Date(`2024-01-${15 + statuses.indexOf(status)}`) // Different dates to avoid duplicates
      };

      const result = await createAttendance(input);
      expect(result.status).toEqual(status);
    }
  });

  it('should create attendance with null notes', async () => {
    const input = {
      ...testInput,
      class_id: testClass[0].id,
      student_id: testStudent[0].id,
      recorded_by: testTeacher[0].id,
      notes: null
    };

    const result = await createAttendance(input);
    expect(result.notes).toBeNull();
  });

  it('should throw error when student is not enrolled in class', async () => {
    // Create a new student not enrolled in the class
    const unenrolledUser = await db.insert(usersTable)
      .values({
        email: 'unenrolled@test.com',
        password_hash: 'hashed_password',
        full_name: 'Unenrolled Student',
        phone: '+60123456783',
        role: 'pelajar',
        is_active: true
      })
      .returning()
      .execute();

    const unenrolledStudent = await db.insert(studentsTable)
      .values({
        user_id: unenrolledUser[0].id,
        study_center_id: testStudyCenter[0].id,
        ic_number: '123456789014',
        date_of_birth: '2005-02-01',
        address: '999 Unenrolled Street',
        parent_name: 'Parent Name',
        parent_phone: '+60123456782',
        emergency_contact: '+60123456781',
        is_active: true
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      class_id: testClass[0].id,
      student_id: unenrolledStudent[0].id,
      recorded_by: testTeacher[0].id
    };

    expect(createAttendance(input)).rejects.toThrow(/student is not enrolled in this class/i);
  });

  it('should throw error for duplicate attendance record', async () => {
    const input = {
      ...testInput,
      class_id: testClass[0].id,
      student_id: testStudent[0].id,
      recorded_by: testTeacher[0].id
    };

    // Create first attendance record
    await createAttendance(input);

    // Try to create duplicate record (same student, class, date)
    expect(createAttendance(input)).rejects.toThrow(/attendance record already exists/i);
  });

  it('should throw error when class does not exist', async () => {
    const input = {
      ...testInput,
      class_id: 99999, // Non-existent class ID
      student_id: testStudent[0].id,
      recorded_by: testTeacher[0].id
    };

    expect(createAttendance(input)).rejects.toThrow(/student is not enrolled in this class/i);
  });

  it('should throw error when student does not exist', async () => {
    const input = {
      ...testInput,
      class_id: testClass[0].id,
      student_id: 99999, // Non-existent student ID
      recorded_by: testTeacher[0].id
    };

    expect(createAttendance(input)).rejects.toThrow(/student is not enrolled in this class/i);
  });

  it('should allow different students to have attendance on same date', async () => {
    // Create another student and enroll in the same class
    const anotherUser = await db.insert(usersTable)
      .values({
        email: 'student2@test.com',
        password_hash: 'hashed_password',
        full_name: 'Another Student',
        phone: '+60123456780',
        role: 'pelajar',
        is_active: true
      })
      .returning()
      .execute();

    const anotherStudent = await db.insert(studentsTable)
      .values({
        user_id: anotherUser[0].id,
        study_center_id: testStudyCenter[0].id,
        ic_number: '123456789015',
        date_of_birth: '2005-03-01',
        address: '888 Another Street',
        parent_name: 'Another Parent',
        parent_phone: '+60123456779',
        emergency_contact: '+60123456778',
        is_active: true
      })
      .returning()
      .execute();

    // Enroll second student in the same class
    await db.insert(classEnrollmentsTable)
      .values({
        class_id: testClass[0].id,
        student_id: anotherStudent[0].id,
        is_active: true
      })
      .execute();

    const sameDate = new Date('2024-01-20');

    // Create attendance for first student
    const input1 = {
      ...testInput,
      class_id: testClass[0].id,
      student_id: testStudent[0].id,
      recorded_by: testTeacher[0].id,
      date: sameDate
    };

    const result1 = await createAttendance(input1);

    // Create attendance for second student on same date - should succeed
    const input2 = {
      ...testInput,
      class_id: testClass[0].id,
      student_id: anotherStudent[0].id,
      recorded_by: testTeacher[0].id,
      date: sameDate,
      status: 'absent' as const
    };

    const result2 = await createAttendance(input2);

    expect(result1.date).toEqual(result2.date);
    expect(result1.student_id).not.toEqual(result2.student_id);
    expect(result1.status).toEqual('present');
    expect(result2.status).toEqual('absent');
  });

  it('should throw error when enrollment is inactive', async () => {
    // Deactivate the enrollment
    await db.update(classEnrollmentsTable)
      .set({ is_active: false })
      .where(
        and(
          eq(classEnrollmentsTable.class_id, testClass[0].id),
          eq(classEnrollmentsTable.student_id, testStudent[0].id)
        )
      )
      .execute();

    const input = {
      ...testInput,
      class_id: testClass[0].id,
      student_id: testStudent[0].id,
      recorded_by: testTeacher[0].id
    };

    expect(createAttendance(input)).rejects.toThrow(/student is not enrolled in this class/i);
  });
});
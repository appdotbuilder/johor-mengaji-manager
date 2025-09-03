import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, teachersTable, studentsTable, classesTable, attendanceTable } from '../db/schema';
import { type GetAttendanceByClassInput } from '../schema';
import { getAttendanceByClass } from '../handlers/get_attendance_by_class';

describe('getAttendanceByClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testStudyCenterId: number;
  let testTeacherId: number;
  let testStudentId: number;
  let testClassId: number;

  beforeEach(async () => {
    // Create prerequisite data
    // Create admin user
    const adminResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed',
        full_name: 'Admin User',
        phone: '1234567890',
        role: 'admin_pusat',
      })
      .returning()
      .execute();
    
    testUserId = adminResult[0].id;

    // Create study center
    const centerResult = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test St',
        phone: '1234567890',
        email: 'center@test.com',
        registration_number: 'REG001',
        admin_id: testUserId,
      })
      .returning()
      .execute();
    
    testStudyCenterId = centerResult[0].id;

    // Create teacher user
    const teacherUserResult = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashed',
        full_name: 'Teacher User',
        phone: '0987654321',
        role: 'pengajar_pusat',
      })
      .returning()
      .execute();

    // Create teacher profile
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: teacherUserResult[0].id,
        study_center_id: testStudyCenterId,
        ic_number: '123456789012',
        date_of_birth: '1990-01-01',
        address: '456 Teacher St',
        qualifications: 'Degree in Education',
        jaij_permit_number: 'JAIJ001',
        jaij_permit_expiry: '2025-12-31',
      })
      .returning()
      .execute();
    
    testTeacherId = teacherResult[0].id;

    // Create student user
    const studentUserResult = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashed',
        full_name: 'Student User',
        phone: '1122334455',
        role: 'pelajar',
      })
      .returning()
      .execute();

    // Create student profile
    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: studentUserResult[0].id,
        study_center_id: testStudyCenterId,
        ic_number: '987654321098',
        date_of_birth: '2000-01-01',
        address: '789 Student St',
        parent_name: 'Parent Name',
        parent_phone: '5566778899',
        emergency_contact: 'Emergency Contact',
      })
      .returning()
      .execute();
    
    testStudentId = studentResult[0].id;

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        study_center_id: testStudyCenterId,
        name: 'Test Class',
        description: 'A class for testing',
        class_type: 'physical',
        teacher_id: testTeacherId,
        schedule_day: 'Monday',
        start_time: '09:00',
        end_time: '11:00',
        max_students: 20,
      })
      .returning()
      .execute();
    
    testClassId = classResult[0].id;
  });

  it('should fetch attendance records for a specific class', async () => {
    // Create test attendance records
    await db.insert(attendanceTable)
      .values([
        {
          class_id: testClassId,
          student_id: testStudentId,
          date: '2024-01-15',
          status: 'present',
          notes: 'On time',
          recorded_by: testUserId,
        },
        {
          class_id: testClassId,
          student_id: testStudentId,
          date: '2024-01-14',
          status: 'absent',
          notes: 'Sick',
          recorded_by: testUserId,
        }
      ])
      .execute();

    const input: GetAttendanceByClassInput = {
      class_id: testClassId,
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(2);
    expect(result[0].class_id).toBe(testClassId);
    expect(result[0].student_id).toBe(testStudentId);
    expect(result[0].status).toBeDefined();
    expect(result[0].recorded_by).toBe(testUserId);
    expect(result[0].recorded_at).toBeInstanceOf(Date);
  });

  it('should filter attendance records by date range', async () => {
    // Create attendance records for different dates
    const dateStrings = ['2024-01-10', '2024-01-15', '2024-01-20', '2024-01-25'];
    
    for (const dateString of dateStrings) {
      await db.insert(attendanceTable)
        .values({
          class_id: testClassId,
          student_id: testStudentId,
          date: dateString,
          status: 'present',
          notes: `Record for ${dateString}`,
          recorded_by: testUserId,
        })
        .execute();
    }

    // Test filtering with date range
    const input: GetAttendanceByClassInput = {
      class_id: testClassId,
      date_from: new Date('2024-01-12'),
      date_to: new Date('2024-01-22'),
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(2);
    
    // Check that all results are within the date range
    result.forEach(record => {
      expect(record.date.getTime() >= input.date_from!.getTime()).toBe(true);
      expect(record.date.getTime() <= input.date_to!.getTime()).toBe(true);
    });
  });

  it('should filter attendance records with date_from only', async () => {
    // Create attendance records for different dates
    await db.insert(attendanceTable)
      .values([
        {
          class_id: testClassId,
          student_id: testStudentId,
          date: '2024-01-10',
          status: 'present',
          notes: 'Past record',
          recorded_by: testUserId,
        },
        {
          class_id: testClassId,
          student_id: testStudentId,
          date: '2024-01-20',
          status: 'present',
          notes: 'Future record',
          recorded_by: testUserId,
        }
      ])
      .execute();

    const input: GetAttendanceByClassInput = {
      class_id: testClassId,
      date_from: new Date('2024-01-15'),
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBe('Future record');
    expect(result[0].date.getTime() >= input.date_from!.getTime()).toBe(true);
  });

  it('should filter attendance records with date_to only', async () => {
    // Create attendance records for different dates
    await db.insert(attendanceTable)
      .values([
        {
          class_id: testClassId,
          student_id: testStudentId,
          date: '2024-01-10',
          status: 'present',
          notes: 'Past record',
          recorded_by: testUserId,
        },
        {
          class_id: testClassId,
          student_id: testStudentId,
          date: '2024-01-20',
          status: 'present',
          notes: 'Future record',
          recorded_by: testUserId,
        }
      ])
      .execute();

    const input: GetAttendanceByClassInput = {
      class_id: testClassId,
      date_to: new Date('2024-01-15'),
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBe('Past record');
    expect(result[0].date.getTime() <= input.date_to!.getTime()).toBe(true);
  });

  it('should return empty array when no attendance records exist for class', async () => {
    const input: GetAttendanceByClassInput = {
      class_id: testClassId,
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when class_id does not exist', async () => {
    const input: GetAttendanceByClassInput = {
      class_id: 99999, // Non-existent class ID
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(0);
  });

  it('should handle different attendance statuses correctly', async () => {
    const testDateString = '2024-01-15';
    const testDate = new Date(testDateString);
    
    // Create multiple students for variety
    const student2Result = await db.insert(usersTable)
      .values({
        email: 'student2@test.com',
        password_hash: 'hashed',
        full_name: 'Student 2',
        phone: '2233445566',
        role: 'pelajar',
      })
      .returning()
      .execute();

    const student2ProfileResult = await db.insert(studentsTable)
      .values({
        user_id: student2Result[0].id,
        study_center_id: testStudyCenterId,
        ic_number: '112233445566',
        date_of_birth: '2001-01-01',
        address: '321 Student2 St',
        parent_name: 'Parent 2',
        parent_phone: '6677889900',
      })
      .returning()
      .execute();

    // Create attendance records with different statuses
    await db.insert(attendanceTable)
      .values([
        {
          class_id: testClassId,
          student_id: testStudentId,
          date: testDateString,
          status: 'present',
          notes: 'On time',
          recorded_by: testUserId,
        },
        {
          class_id: testClassId,
          student_id: student2ProfileResult[0].id,
          date: testDateString,
          status: 'late',
          notes: '10 minutes late',
          recorded_by: testUserId,
        }
      ])
      .execute();

    const input: GetAttendanceByClassInput = {
      class_id: testClassId,
      date_from: testDate,
      date_to: testDate,
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(2);
    
    const statuses = result.map(r => r.status);
    expect(statuses).toContain('present');
    expect(statuses).toContain('late');
  });
});
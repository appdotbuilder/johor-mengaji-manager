import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, teachersTable, classesTable } from '../db/schema';
import { getClasses } from '../handlers/get_classes';

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no classes exist', async () => {
    const result = await getClasses();
    expect(result).toEqual([]);
  });

  it('should fetch all classes from database', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'admin@test.com',
          password_hash: 'hashedpassword123',
          full_name: 'Admin User',
          phone: '+60123456789',
          role: 'admin_pusat',
        },
        {
          email: 'teacher@test.com',
          password_hash: 'hashedpassword456',
          full_name: 'Teacher User',
          phone: '+60123456790',
          role: 'pengajar_pusat',
        }
      ])
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        phone: '+60123456789',
        email: 'center@test.com',
        registration_number: 'REG123',
        admin_id: users[0].id,
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: users[1].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1985-01-01',
        address: '456 Teacher Street',
        qualifications: 'Masters in Education',
        jaij_permit_number: 'JAIJ123',
        jaij_permit_expiry: '2025-12-31',
      })
      .returning()
      .execute();

    // Create test classes
    const testClasses = await db.insert(classesTable)
      .values([
        {
          study_center_id: studyCenter[0].id,
          name: 'Beginner Quran Class',
          description: 'Introduction to Quran reading',
          class_type: 'physical',
          teacher_id: teacher[0].id,
          schedule_day: 'Monday',
          start_time: '09:00',
          end_time: '10:30',
          max_students: 15,
        },
        {
          study_center_id: studyCenter[0].id,
          name: 'Advanced Arabic Class',
          description: 'Advanced Arabic language study',
          class_type: 'online',
          teacher_id: teacher[0].id,
          schedule_day: 'Wednesday',
          start_time: '14:00',
          end_time: '15:30',
          max_students: 20,
        }
      ])
      .returning()
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(2);
    
    // Verify first class
    const firstClass = result.find(c => c.name === 'Beginner Quran Class');
    expect(firstClass).toBeDefined();
    expect(firstClass!.id).toEqual(testClasses[0].id);
    expect(firstClass!.study_center_id).toEqual(studyCenter[0].id);
    expect(firstClass!.name).toEqual('Beginner Quran Class');
    expect(firstClass!.description).toEqual('Introduction to Quran reading');
    expect(firstClass!.class_type).toEqual('physical');
    expect(firstClass!.teacher_id).toEqual(teacher[0].id);
    expect(firstClass!.schedule_day).toEqual('Monday');
    expect(firstClass!.start_time).toEqual('09:00');
    expect(firstClass!.end_time).toEqual('10:30');
    expect(firstClass!.max_students).toEqual(15);
    expect(firstClass!.is_active).toEqual(true);
    expect(firstClass!.created_at).toBeInstanceOf(Date);
    expect(firstClass!.updated_at).toBeInstanceOf(Date);

    // Verify second class
    const secondClass = result.find(c => c.name === 'Advanced Arabic Class');
    expect(secondClass).toBeDefined();
    expect(secondClass!.id).toEqual(testClasses[1].id);
    expect(secondClass!.study_center_id).toEqual(studyCenter[0].id);
    expect(secondClass!.name).toEqual('Advanced Arabic Class');
    expect(secondClass!.description).toEqual('Advanced Arabic language study');
    expect(secondClass!.class_type).toEqual('online');
    expect(secondClass!.teacher_id).toEqual(teacher[0].id);
    expect(secondClass!.schedule_day).toEqual('Wednesday');
    expect(secondClass!.start_time).toEqual('14:00');
    expect(secondClass!.end_time).toEqual('15:30');
    expect(secondClass!.max_students).toEqual(20);
    expect(secondClass!.is_active).toEqual(true);
    expect(secondClass!.created_at).toBeInstanceOf(Date);
    expect(secondClass!.updated_at).toBeInstanceOf(Date);
  });

  it('should include inactive classes in results', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'admin@test.com',
          password_hash: 'hashedpassword123',
          full_name: 'Admin User',
          phone: '+60123456789',
          role: 'admin_pusat',
        },
        {
          email: 'teacher@test.com',
          password_hash: 'hashedpassword456',
          full_name: 'Teacher User',
          phone: '+60123456790',
          role: 'pengajar_pusat',
        }
      ])
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        phone: '+60123456789',
        email: 'center@test.com',
        registration_number: 'REG123',
        admin_id: users[0].id,
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: users[1].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1985-01-01',
        address: '456 Teacher Street',
      })
      .returning()
      .execute();

    // Create active and inactive classes
    await db.insert(classesTable)
      .values([
        {
          study_center_id: studyCenter[0].id,
          name: 'Active Class',
          class_type: 'physical',
          teacher_id: teacher[0].id,
          schedule_day: 'Monday',
          start_time: '09:00',
          end_time: '10:30',
          max_students: 15,
          is_active: true,
        },
        {
          study_center_id: studyCenter[0].id,
          name: 'Inactive Class',
          class_type: 'online',
          teacher_id: teacher[0].id,
          schedule_day: 'Tuesday',
          start_time: '14:00',
          end_time: '15:30',
          max_students: 10,
          is_active: false,
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(2);
    
    const activeClass = result.find(c => c.name === 'Active Class');
    const inactiveClass = result.find(c => c.name === 'Inactive Class');
    
    expect(activeClass).toBeDefined();
    expect(activeClass!.is_active).toEqual(true);
    
    expect(inactiveClass).toBeDefined();
    expect(inactiveClass!.is_active).toEqual(false);
  });

  it('should handle classes with null description', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'admin@test.com',
          password_hash: 'hashedpassword123',
          full_name: 'Admin User',
          phone: '+60123456789',
          role: 'admin_pusat',
        },
        {
          email: 'teacher@test.com',
          password_hash: 'hashedpassword456',
          full_name: 'Teacher User',
          phone: '+60123456790',
          role: 'pengajar_pusat',
        }
      ])
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        admin_id: users[0].id,
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: users[1].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1985-01-01',
        address: '456 Teacher Street',
      })
      .returning()
      .execute();

    // Create class with null description
    await db.insert(classesTable)
      .values({
        study_center_id: studyCenter[0].id,
        name: 'Class Without Description',
        description: null, // Explicitly set to null
        class_type: 'on_call',
        teacher_id: teacher[0].id,
        schedule_day: 'Friday',
        start_time: '10:00',
        end_time: '11:00',
        max_students: 5,
      })
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Class Without Description');
    expect(result[0].description).toBeNull();
    expect(result[0].class_type).toEqual('on_call');
  });

  it('should handle different class types correctly', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'admin@test.com',
          password_hash: 'hashedpassword123',
          full_name: 'Admin User',
          phone: '+60123456789',
          role: 'admin_pusat',
        },
        {
          email: 'teacher@test.com',
          password_hash: 'hashedpassword456',
          full_name: 'Teacher User',
          phone: '+60123456790',
          role: 'pengajar_pusat',
        }
      ])
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        admin_id: users[0].id,
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: users[1].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1985-01-01',
        address: '456 Teacher Street',
      })
      .returning()
      .execute();

    // Create classes with different types
    await db.insert(classesTable)
      .values([
        {
          study_center_id: studyCenter[0].id,
          name: 'Physical Class',
          class_type: 'physical',
          teacher_id: teacher[0].id,
          schedule_day: 'Monday',
          start_time: '09:00',
          end_time: '10:30',
          max_students: 15,
        },
        {
          study_center_id: studyCenter[0].id,
          name: 'Online Class',
          class_type: 'online',
          teacher_id: teacher[0].id,
          schedule_day: 'Tuesday',
          start_time: '14:00',
          end_time: '15:30',
          max_students: 30,
        },
        {
          study_center_id: studyCenter[0].id,
          name: 'On Call Class',
          class_type: 'on_call',
          teacher_id: teacher[0].id,
          schedule_day: 'Wednesday',
          start_time: '16:00',
          end_time: '17:00',
          max_students: 1,
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(3);
    
    const physicalClass = result.find(c => c.class_type === 'physical');
    const onlineClass = result.find(c => c.class_type === 'online');
    const onCallClass = result.find(c => c.class_type === 'on_call');
    
    expect(physicalClass).toBeDefined();
    expect(physicalClass!.name).toEqual('Physical Class');
    expect(physicalClass!.max_students).toEqual(15);
    
    expect(onlineClass).toBeDefined();
    expect(onlineClass!.name).toEqual('Online Class');
    expect(onlineClass!.max_students).toEqual(30);
    
    expect(onCallClass).toBeDefined();
    expect(onCallClass!.name).toEqual('On Call Class');
    expect(onCallClass!.max_students).toEqual(1);
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, teachersTable, classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq, and } from 'drizzle-orm';

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let adminUser: any;
  let studyCenter: any;
  let teacherUser: any;
  let teacher: any;

  const setupTestData = async () => {
    // Create admin user
    const adminResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        phone: '123456789',
        role: 'admin_pusat',
      })
      .returning()
      .execute();
    adminUser = adminResult[0];

    // Create study center
    const centerResult = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        phone: '987654321',
        email: 'center@example.com',
        registration_number: 'REG001',
        admin_id: adminUser.id,
      })
      .returning()
      .execute();
    studyCenter = centerResult[0];

    // Create teacher user
    const teacherUserResult = await db.insert(usersTable)
      .values({
        email: 'teacher@example.com',
        password_hash: 'hashed_password',
        full_name: 'Teacher User',
        phone: '555666777',
        role: 'pengajar_pusat',
      })
      .returning()
      .execute();
    teacherUser = teacherUserResult[0];

    // Create teacher profile
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        study_center_id: studyCenter.id,
        ic_number: '123456-78-9012',
        date_of_birth: '1985-05-15',
        address: '456 Teacher Lane',
        qualifications: 'Bachelor of Education',
        jaij_permit_number: 'JAIJ001',
        jaij_permit_expiry: '2025-12-31',
      })
      .returning()
      .execute();
    teacher = teacherResult[0];
  };

  const createTestInput = (overrides: Partial<CreateClassInput> = {}): CreateClassInput => ({
    study_center_id: studyCenter.id,
    name: 'Quran Reading Class',
    description: 'Basic Quran reading for beginners',
    class_type: 'physical' as const,
    teacher_id: teacher.id,
    schedule_day: 'Monday',
    start_time: '09:00',
    end_time: '10:30',
    max_students: 20,
    ...overrides,
  });

  it('should create a class successfully', async () => {
    await setupTestData();
    const input = createTestInput();

    const result = await createClass(input);

    // Verify returned class data
    expect(result.id).toBeDefined();
    expect(result.name).toEqual('Quran Reading Class');
    expect(result.description).toEqual('Basic Quran reading for beginners');
    expect(result.class_type).toEqual('physical');
    expect(result.teacher_id).toEqual(teacher.id);
    expect(result.study_center_id).toEqual(studyCenter.id);
    expect(result.schedule_day).toEqual('Monday');
    expect(result.start_time).toEqual('09:00');
    expect(result.end_time).toEqual('10:30');
    expect(result.max_students).toEqual(20);
    expect(result.is_active).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    await setupTestData();
    const input = createTestInput();

    const result = await createClass(input);

    // Verify data was saved to database
    const savedClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(savedClasses).toHaveLength(1);
    expect(savedClasses[0].name).toEqual('Quran Reading Class');
    expect(savedClasses[0].teacher_id).toEqual(teacher.id);
    expect(savedClasses[0].study_center_id).toEqual(studyCenter.id);
    expect(savedClasses[0].is_active).toEqual(true);
  });

  it('should create class with nullable description', async () => {
    await setupTestData();
    const input = createTestInput({ description: null });

    const result = await createClass(input);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Quran Reading Class');
  });

  it('should create online class type', async () => {
    await setupTestData();
    const input = createTestInput({ class_type: 'online' });

    const result = await createClass(input);

    expect(result.class_type).toEqual('online');
  });

  it('should create on_call class type', async () => {
    await setupTestData();
    const input = createTestInput({ class_type: 'on_call' });

    const result = await createClass(input);

    expect(result.class_type).toEqual('on_call');
  });

  it('should fail when study center does not exist', async () => {
    await setupTestData();
    const input = createTestInput({ study_center_id: 99999 });

    await expect(createClass(input)).rejects.toThrow(/study center not found or inactive/i);
  });

  it('should fail when study center is inactive', async () => {
    await setupTestData();
    
    // Deactivate study center
    await db.update(studyCentersTable)
      .set({ is_active: false })
      .where(eq(studyCentersTable.id, studyCenter.id))
      .execute();

    const input = createTestInput();

    await expect(createClass(input)).rejects.toThrow(/study center not found or inactive/i);
  });

  it('should fail when teacher does not exist', async () => {
    await setupTestData();
    const input = createTestInput({ teacher_id: 99999 });

    await expect(createClass(input)).rejects.toThrow(/teacher not found/i);
  });

  it('should fail when teacher is inactive', async () => {
    await setupTestData();
    
    // Deactivate teacher
    await db.update(teachersTable)
      .set({ is_active: false })
      .where(eq(teachersTable.id, teacher.id))
      .execute();

    const input = createTestInput();

    await expect(createClass(input)).rejects.toThrow(/teacher not found/i);
  });

  it('should fail when teacher belongs to different study center', async () => {
    await setupTestData();

    // Create another study center
    const anotherCenterResult = await db.insert(studyCentersTable)
      .values({
        name: 'Another Study Center',
        address: '789 Another Street',
        admin_id: adminUser.id,
      })
      .returning()
      .execute();
    const anotherCenter = anotherCenterResult[0];

    const input = createTestInput({ study_center_id: anotherCenter.id });

    await expect(createClass(input)).rejects.toThrow(/does not belong to the study center/i);
  });

  it('should fail when teacher has scheduling conflict - exact time overlap', async () => {
    await setupTestData();
    
    // Create first class
    const firstInput = createTestInput();
    await createClass(firstInput);

    // Try to create another class with same time slot
    const conflictingInput = createTestInput({
      name: 'Conflicting Class'
    });

    await expect(createClass(conflictingInput)).rejects.toThrow(/scheduling conflict/i);
  });

  it('should fail when teacher has scheduling conflict - partial overlap', async () => {
    await setupTestData();
    
    // Create first class (09:00-10:30)
    const firstInput = createTestInput();
    await createClass(firstInput);

    // Try to create overlapping class (10:00-11:30)
    const conflictingInput = createTestInput({
      name: 'Conflicting Class',
      start_time: '10:00',
      end_time: '11:30'
    });

    await expect(createClass(conflictingInput)).rejects.toThrow(/scheduling conflict/i);
  });

  it('should allow same teacher on different days', async () => {
    await setupTestData();
    
    // Create Monday class
    const mondayInput = createTestInput({ schedule_day: 'Monday' });
    await createClass(mondayInput);

    // Create Tuesday class with same teacher
    const tuesdayInput = createTestInput({ 
      name: 'Tuesday Class',
      schedule_day: 'Tuesday' 
    });

    const result = await createClass(tuesdayInput);

    expect(result.name).toEqual('Tuesday Class');
    expect(result.schedule_day).toEqual('Tuesday');
  });

  it('should allow same teacher on same day with non-overlapping times', async () => {
    await setupTestData();
    
    // Create morning class (09:00-10:30)
    const morningInput = createTestInput({ 
      name: 'Morning Class',
      start_time: '09:00',
      end_time: '10:30'
    });
    await createClass(morningInput);

    // Create afternoon class (14:00-15:30) - no overlap
    const afternoonInput = createTestInput({ 
      name: 'Afternoon Class',
      start_time: '14:00',
      end_time: '15:30'
    });

    const result = await createClass(afternoonInput);

    expect(result.name).toEqual('Afternoon Class');
    expect(result.start_time).toEqual('14:00');
  });

  it('should ignore inactive classes when checking conflicts', async () => {
    await setupTestData();
    
    // Create first class
    const firstInput = createTestInput();
    const firstClass = await createClass(firstInput);

    // Deactivate the first class
    await db.update(classesTable)
      .set({ is_active: false })
      .where(eq(classesTable.id, firstClass.id))
      .execute();

    // Should be able to create another class with same time slot
    const secondInput = createTestInput({
      name: 'Second Class'
    });

    const result = await createClass(secondInput);

    expect(result.name).toEqual('Second Class');
  });
});
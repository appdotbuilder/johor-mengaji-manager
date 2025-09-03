import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, teachersTable } from '../db/schema';
import { getTeachers } from '../handlers/get_teachers';

describe('getTeachers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no teachers exist', async () => {
    const result = await getTeachers();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should fetch all teachers correctly', async () => {
    // Create prerequisite data
    const [adminUser] = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        phone: '+60123456789',
        role: 'admin_pusat',
      })
      .returning()
      .execute();

    const [teacherUser] = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashed_password',
        full_name: 'Teacher User',
        phone: '+60123456790',
        role: 'pengajar_pusat',
      })
      .returning()
      .execute();

    const [studyCenter] = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street, Test City',
        phone: '+60123456789',
        email: 'center@test.com',
        registration_number: 'REG001',
        admin_id: adminUser.id,
      })
      .returning()
      .execute();

    // Create teacher
    await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        study_center_id: studyCenter.id,
        ic_number: '123456789012',
        date_of_birth: '1990-01-15',
        address: '456 Teacher Avenue, Teacher Town',
        qualifications: 'Bachelor of Education',
        jaij_permit_number: 'JAIJ001',
        jaij_permit_expiry: '2025-12-31',
      })
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(1);
    
    const teacher = result[0];
    expect(teacher.user_id).toEqual(teacherUser.id);
    expect(teacher.study_center_id).toEqual(studyCenter.id);
    expect(teacher.ic_number).toEqual('123456789012');
    expect(teacher.date_of_birth).toBeInstanceOf(Date);
    expect(teacher.date_of_birth.toISOString()).toEqual(new Date('1990-01-15').toISOString());
    expect(teacher.address).toEqual('456 Teacher Avenue, Teacher Town');
    expect(teacher.qualifications).toEqual('Bachelor of Education');
    expect(teacher.jaij_permit_number).toEqual('JAIJ001');
    expect(teacher.jaij_permit_expiry).toBeInstanceOf(Date);
    expect(teacher.jaij_permit_expiry?.toISOString()).toEqual(new Date('2025-12-31').toISOString());
    expect(teacher.is_active).toBe(true);
    expect(teacher.id).toBeDefined();
    expect(teacher.created_at).toBeInstanceOf(Date);
    expect(teacher.updated_at).toBeInstanceOf(Date);
  });

  it('should fetch multiple teachers correctly', async () => {
    // Create prerequisite users
    const [adminUser] = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        role: 'admin_pusat',
      })
      .returning()
      .execute();

    const teacherUsers = await db.insert(usersTable)
      .values([
        {
          email: 'teacher1@test.com',
          password_hash: 'hashed_password',
          full_name: 'Teacher One',
          role: 'pengajar_pusat',
        },
        {
          email: 'teacher2@test.com',
          password_hash: 'hashed_password',
          full_name: 'Teacher Two',
          role: 'pengajar_pusat',
        },
      ])
      .returning()
      .execute();

    const [studyCenter] = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street, Test City',
        admin_id: adminUser.id,
      })
      .returning()
      .execute();

    // Create multiple teachers
    await db.insert(teachersTable)
      .values([
        {
          user_id: teacherUsers[0].id,
          study_center_id: studyCenter.id,
          ic_number: '123456789012',
          date_of_birth: '1990-01-15',
          address: '456 Teacher Avenue',
          qualifications: 'Bachelor of Education',
        },
        {
          user_id: teacherUsers[1].id,
          study_center_id: studyCenter.id,
          ic_number: '123456789013',
          date_of_birth: '1985-05-20',
          address: '789 Teacher Boulevard',
          qualifications: 'Master of Education',
        },
      ])
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(2);
    
    // Verify all teachers are returned
    const teacher1 = result.find(t => t.ic_number === '123456789012');
    const teacher2 = result.find(t => t.ic_number === '123456789013');
    
    expect(teacher1).toBeDefined();
    expect(teacher2).toBeDefined();
    
    expect(teacher1?.qualifications).toEqual('Bachelor of Education');
    expect(teacher2?.qualifications).toEqual('Master of Education');
    
    // Verify date objects
    expect(teacher1?.date_of_birth).toBeInstanceOf(Date);
    expect(teacher2?.date_of_birth).toBeInstanceOf(Date);
    expect(teacher1?.created_at).toBeInstanceOf(Date);
    expect(teacher2?.created_at).toBeInstanceOf(Date);
  });

  it('should handle teachers with null optional fields', async () => {
    // Create prerequisite data
    const [adminUser] = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        role: 'admin_pusat',
      })
      .returning()
      .execute();

    const [teacherUser] = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashed_password',
        full_name: 'Teacher User',
        role: 'pengajar_pusat',
      })
      .returning()
      .execute();

    const [studyCenter] = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street, Test City',
        admin_id: adminUser.id,
      })
      .returning()
      .execute();

    // Create teacher with minimal required fields only
    await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        study_center_id: studyCenter.id,
        ic_number: '123456789012',
        date_of_birth: '1990-01-15',
        address: '456 Teacher Avenue, Teacher Town',
        qualifications: null,
        jaij_permit_number: null,
        jaij_permit_expiry: null,
      })
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(1);
    
    const teacher = result[0];
    expect(teacher.qualifications).toBeNull();
    expect(teacher.jaij_permit_number).toBeNull();
    expect(teacher.jaij_permit_expiry).toBeNull();
    expect(teacher.date_of_birth).toBeInstanceOf(Date);
    expect(teacher.created_at).toBeInstanceOf(Date);
    expect(teacher.updated_at).toBeInstanceOf(Date);
  });

  it('should include both active and inactive teachers', async () => {
    // Create prerequisite data
    const [adminUser] = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        role: 'admin_pusat',
      })
      .returning()
      .execute();

    const teacherUsers = await db.insert(usersTable)
      .values([
        {
          email: 'teacher1@test.com',
          password_hash: 'hashed_password',
          full_name: 'Active Teacher',
          role: 'pengajar_pusat',
        },
        {
          email: 'teacher2@test.com',
          password_hash: 'hashed_password',
          full_name: 'Inactive Teacher',
          role: 'pengajar_pusat',
        },
      ])
      .returning()
      .execute();

    const [studyCenter] = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street, Test City',
        admin_id: adminUser.id,
      })
      .returning()
      .execute();

    // Create active and inactive teachers
    await db.insert(teachersTable)
      .values([
        {
          user_id: teacherUsers[0].id,
          study_center_id: studyCenter.id,
          ic_number: '123456789012',
          date_of_birth: '1990-01-15',
          address: '456 Active Teacher Avenue',
          is_active: true,
        },
        {
          user_id: teacherUsers[1].id,
          study_center_id: studyCenter.id,
          ic_number: '123456789013',
          date_of_birth: '1985-05-20',
          address: '789 Inactive Teacher Boulevard',
          is_active: false,
        },
      ])
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(2);
    
    const activeTeacher = result.find(t => t.ic_number === '123456789012');
    const inactiveTeacher = result.find(t => t.ic_number === '123456789013');
    
    expect(activeTeacher?.is_active).toBe(true);
    expect(inactiveTeacher?.is_active).toBe(false);
  });
});
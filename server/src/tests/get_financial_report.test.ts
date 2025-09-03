import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  studyCentersTable, 
  studentsTable, 
  paymentsTable, 
  fundTransactionsTable, 
  materialDistributionsTable 
} from '../db/schema';
import { getFinancialReport } from '../handlers/get_financial_report';

describe('getFinancialReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate basic financial report for study center', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        phone: '1234567890',
        role: 'admin_pusat'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test St',
        phone: '1234567890',
        email: 'center@test.com',
        registration_number: 'REG001',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const studentUser = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashed_password',
        full_name: 'Student User',
        phone: '1234567891',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789012',
        date_of_birth: '1995-01-01',
        address: '456 Student St',
        parent_name: 'Parent Name',
        parent_phone: '1234567892',
        emergency_contact: '1234567893'
      })
      .returning()
      .execute();

    // Create test payments
    await db.insert(paymentsTable)
      .values([
        {
          student_id: student[0].id,
          study_center_id: studyCenter[0].id,
          amount: '100.50',
          description: 'Monthly fee',
          status: 'paid',
          due_date: '2024-01-15',
          paid_date: '2024-01-10',
          recorded_by: adminUser[0].id
        },
        {
          student_id: student[0].id,
          study_center_id: studyCenter[0].id,
          amount: '75.00',
          description: 'Book fee',
          status: 'pending',
          due_date: '2024-02-15',
          recorded_by: adminUser[0].id
        }
      ])
      .execute();

    // Create test fund transactions
    await db.insert(fundTransactionsTable)
      .values([
        {
          study_center_id: studyCenter[0].id,
          fund_type: 'donation',
          amount: '500.00',
          description: 'Monthly donation',
          contributor_name: 'John Doe',
          contributor_phone: '1234567894',
          transaction_date: '2024-01-05',
          recorded_by: adminUser[0].id
        },
        {
          study_center_id: studyCenter[0].id,
          fund_type: 'waqf',
          amount: '1000.00',
          description: 'Waqf contribution',
          contributor_name: 'Jane Smith',
          contributor_phone: '1234567895',
          transaction_date: '2024-01-20',
          recorded_by: adminUser[0].id
        }
      ])
      .execute();

    // Create test material distributions
    await db.insert(materialDistributionsTable)
      .values({
        study_center_id: studyCenter[0].id,
        material_type: 'quran',
        item_name: 'Al-Quran',
        quantity: 5,
        recipient_id: studentUser[0].id,
        distribution_date: '2024-01-15',
        is_sale: true,
        price: '25.00',
        notes: 'Quran sale',
        recorded_by: adminUser[0].id
      })
      .execute();

    const result = await getFinancialReport(studyCenter[0].id);

    // Verify basic report structure
    expect(result.studyCenterId).toEqual(studyCenter[0].id);
    expect(typeof result.totalPayments).toBe('number');
    expect(typeof result.totalDonations).toBe('number');
    expect(typeof result.totalExpenses).toBe('number');
    expect(typeof result.paymentsByStatus).toBe('object');
    expect(typeof result.fundsByType).toBe('object');
    expect(Array.isArray(result.monthlyTrends)).toBe(true);

    // Verify calculated values
    expect(result.totalPayments).toEqual(100.5); // Only paid payments
    expect(result.totalDonations).toEqual(1500); // Sum of all fund transactions
    expect(result.totalExpenses).toEqual(25); // Material sales

    // Verify payments by status
    expect(result.paymentsByStatus['paid']).toEqual(100.5);
    expect(result.paymentsByStatus['pending']).toEqual(75);

    // Verify funds by type
    expect(result.fundsByType['donation']).toEqual(500);
    expect(result.fundsByType['waqf']).toEqual(1000);

    // Verify monthly trends
    expect(result.monthlyTrends.length).toBeGreaterThan(0);
    const januaryTrend = result.monthlyTrends.find(t => t.month === '2024-01');
    if (januaryTrend) {
      expect(januaryTrend.payments).toEqual(100.5);
      expect(januaryTrend.donations).toEqual(1500);
    }
  });

  it('should handle date range filtering correctly', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin2@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User 2',
        phone: '1234567896',
        role: 'admin_pusat'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center 2',
        address: '789 Test Ave',
        phone: '1234567897',
        email: 'center2@test.com',
        registration_number: 'REG002',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const studentUser = await db.insert(usersTable)
      .values({
        email: 'student2@test.com',
        password_hash: 'hashed_password',
        full_name: 'Student User 2',
        phone: '1234567898',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789013',
        date_of_birth: '1996-01-01',
        address: '789 Student Ave',
        parent_name: 'Parent Name 2',
        parent_phone: '1234567899',
        emergency_contact: '1234567900'
      })
      .returning()
      .execute();

    // Create payments with different dates
    await db.insert(paymentsTable)
      .values([
        {
          student_id: student[0].id,
          study_center_id: studyCenter[0].id,
          amount: '200.00',
          description: 'January fee',
          status: 'paid',
          due_date: '2024-01-15',
          paid_date: '2024-01-10',
          recorded_by: adminUser[0].id
        },
        {
          student_id: student[0].id,
          study_center_id: studyCenter[0].id,
          amount: '300.00',
          description: 'March fee',
          status: 'paid',
          due_date: '2024-03-15',
          paid_date: '2024-03-10',
          recorded_by: adminUser[0].id
        }
      ])
      .execute();

    // Create fund transactions with different dates
    await db.insert(fundTransactionsTable)
      .values([
        {
          study_center_id: studyCenter[0].id,
          fund_type: 'donation',
          amount: '400.00',
          description: 'January donation',
          contributor_name: 'Donor A',
          contributor_phone: '1234567901',
          transaction_date: '2024-01-05',
          recorded_by: adminUser[0].id
        },
        {
          study_center_id: studyCenter[0].id,
          fund_type: 'donation',
          amount: '600.00',
          description: 'March donation',
          contributor_name: 'Donor B',
          contributor_phone: '1234567902',
          transaction_date: '2024-03-05',
          recorded_by: adminUser[0].id
        }
      ])
      .execute();

    // Test date range filtering (January to February)
    const dateFrom = new Date('2024-01-01');
    const dateTo = new Date('2024-02-28');
    
    const result = await getFinancialReport(studyCenter[0].id, dateFrom, dateTo);

    // Should only include January data
    expect(result.totalPayments).toEqual(200); // Only January payment
    expect(result.totalDonations).toEqual(400); // Only January donation
    
    // Verify monthly trends contain only January
    const januaryTrend = result.monthlyTrends.find(t => t.month === '2024-01');
    const marchTrend = result.monthlyTrends.find(t => t.month === '2024-03');
    
    expect(januaryTrend?.payments).toEqual(200);
    expect(januaryTrend?.donations).toEqual(400);
    expect(marchTrend).toBeUndefined(); // Should not include March data
  });

  it('should return empty report for non-existent study center', async () => {
    const result = await getFinancialReport(999); // Non-existent ID

    expect(result.studyCenterId).toEqual(999);
    expect(result.totalPayments).toEqual(0);
    expect(result.totalDonations).toEqual(0);
    expect(result.totalExpenses).toEqual(0);
    expect(Object.keys(result.paymentsByStatus)).toHaveLength(0);
    expect(Object.keys(result.fundsByType)).toHaveLength(0);
    expect(result.monthlyTrends).toHaveLength(0);
  });

  it('should handle study center with no financial data', async () => {
    // Create study center with no payments or transactions
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin3@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User 3',
        phone: '1234567903',
        role: 'admin_pusat'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Empty Study Center',
        address: '000 Empty St',
        phone: '1234567904',
        email: 'empty@test.com',
        registration_number: 'REG003',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const result = await getFinancialReport(studyCenter[0].id);

    expect(result.studyCenterId).toEqual(studyCenter[0].id);
    expect(result.totalPayments).toEqual(0);
    expect(result.totalDonations).toEqual(0);
    expect(result.totalExpenses).toEqual(0);
    expect(Object.keys(result.paymentsByStatus)).toHaveLength(0);
    expect(Object.keys(result.fundsByType)).toHaveLength(0);
    expect(result.monthlyTrends).toHaveLength(0);
  });

  it('should correctly aggregate multiple fund types and payment statuses', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin4@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User 4',
        phone: '1234567905',
        role: 'admin_pusat'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Multi-Type Study Center',
        address: '456 Multi St',
        phone: '1234567906',
        email: 'multi@test.com',
        registration_number: 'REG004',
        admin_id: adminUser[0].id
      })
      .returning()
      .execute();

    const studentUser = await db.insert(usersTable)
      .values({
        email: 'student4@test.com',
        password_hash: 'hashed_password',
        full_name: 'Student User 4',
        phone: '1234567907',
        role: 'pelajar'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        study_center_id: studyCenter[0].id,
        ic_number: '123456789014',
        date_of_birth: '1997-01-01',
        address: '456 Multi Ave',
        parent_name: 'Parent Name 4',
        parent_phone: '1234567908',
        emergency_contact: '1234567909'
      })
      .returning()
      .execute();

    // Create diverse payment statuses
    await db.insert(paymentsTable)
      .values([
        {
          student_id: student[0].id,
          study_center_id: studyCenter[0].id,
          amount: '150.00',
          description: 'Paid fee 1',
          status: 'paid',
          due_date: '2024-01-15',
          paid_date: '2024-01-10',
          recorded_by: adminUser[0].id
        },
        {
          student_id: student[0].id,
          study_center_id: studyCenter[0].id,
          amount: '100.00',
          description: 'Paid fee 2',
          status: 'paid',
          due_date: '2024-01-20',
          paid_date: '2024-01-18',
          recorded_by: adminUser[0].id
        },
        {
          student_id: student[0].id,
          study_center_id: studyCenter[0].id,
          amount: '80.00',
          description: 'Pending fee',
          status: 'pending',
          due_date: '2024-02-15',
          recorded_by: adminUser[0].id
        },
        {
          student_id: student[0].id,
          study_center_id: studyCenter[0].id,
          amount: '60.00',
          description: 'Overdue fee',
          status: 'overdue',
          due_date: '2024-01-01',
          recorded_by: adminUser[0].id
        }
      ])
      .execute();

    // Create diverse fund types
    await db.insert(fundTransactionsTable)
      .values([
        {
          study_center_id: studyCenter[0].id,
          fund_type: 'donation',
          amount: '200.00',
          description: 'Donation 1',
          transaction_date: '2024-01-10',
          recorded_by: adminUser[0].id
        },
        {
          study_center_id: studyCenter[0].id,
          fund_type: 'donation',
          amount: '300.00',
          description: 'Donation 2',
          transaction_date: '2024-01-15',
          recorded_by: adminUser[0].id
        },
        {
          study_center_id: studyCenter[0].id,
          fund_type: 'waqf',
          amount: '1000.00',
          description: 'Waqf fund',
          transaction_date: '2024-01-20',
          recorded_by: adminUser[0].id
        },
        {
          study_center_id: studyCenter[0].id,
          fund_type: 'infaq',
          amount: '150.00',
          description: 'Infaq fund',
          transaction_date: '2024-01-25',
          recorded_by: adminUser[0].id
        }
      ])
      .execute();

    const result = await getFinancialReport(studyCenter[0].id);

    // Verify aggregated payments by status
    expect(result.paymentsByStatus['paid']).toEqual(250); // 150 + 100
    expect(result.paymentsByStatus['pending']).toEqual(80);
    expect(result.paymentsByStatus['overdue']).toEqual(60);

    // Verify aggregated funds by type
    expect(result.fundsByType['donation']).toEqual(500); // 200 + 300
    expect(result.fundsByType['waqf']).toEqual(1000);
    expect(result.fundsByType['infaq']).toEqual(150);

    // Verify totals
    expect(result.totalPayments).toEqual(250); // Only paid payments
    expect(result.totalDonations).toEqual(1650); // Sum of all fund types
  });
});
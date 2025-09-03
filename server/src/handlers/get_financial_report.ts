import { db } from '../db';
import { paymentsTable, fundTransactionsTable, materialDistributionsTable } from '../db/schema';
import { eq, and, gte, lte, sql, SQL } from 'drizzle-orm';

export interface FinancialReportData {
  studyCenterId: number;
  totalPayments: number;
  totalDonations: number;
  totalExpenses: number;
  paymentsByStatus: Record<string, number>;
  fundsByType: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    payments: number;
    donations: number;
  }>;
}

export async function getFinancialReport(studyCenterId: number, dateFrom?: Date, dateTo?: Date): Promise<FinancialReportData> {
  try {
    // Build conditions array for filtering
    const paymentConditions: SQL<unknown>[] = [eq(paymentsTable.study_center_id, studyCenterId)];
    const fundConditions: SQL<unknown>[] = [eq(fundTransactionsTable.study_center_id, studyCenterId)];
    const materialConditions: SQL<unknown>[] = [eq(materialDistributionsTable.study_center_id, studyCenterId)];

    // Add date filters if provided (convert Date to string for date columns)
    if (dateFrom) {
      const dateFromStr = dateFrom.toISOString().split('T')[0];
      paymentConditions.push(gte(paymentsTable.due_date, dateFromStr));
      fundConditions.push(gte(fundTransactionsTable.transaction_date, dateFromStr));
      materialConditions.push(gte(materialDistributionsTable.distribution_date, dateFromStr));
    }

    if (dateTo) {
      const dateToStr = dateTo.toISOString().split('T')[0];
      paymentConditions.push(lte(paymentsTable.due_date, dateToStr));
      fundConditions.push(lte(fundTransactionsTable.transaction_date, dateToStr));
      materialConditions.push(lte(materialDistributionsTable.distribution_date, dateToStr));
    }

    // Get total payments (only paid ones)
    const totalPaymentsResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)`
      })
      .from(paymentsTable)
      .where(and(
        ...paymentConditions,
        eq(paymentsTable.status, 'paid')
      ))
      .execute();

    const totalPayments = parseFloat(totalPaymentsResult[0]?.total || '0');

    // Get payments by status
    const paymentsByStatusResult = await db
      .select({
        status: paymentsTable.status,
        total: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)`
      })
      .from(paymentsTable)
      .where(and(...paymentConditions))
      .groupBy(paymentsTable.status)
      .execute();

    const paymentsByStatus: Record<string, number> = {};
    paymentsByStatusResult.forEach(row => {
      paymentsByStatus[row.status] = parseFloat(row.total);
    });

    // Get total donations (fund transactions)
    const totalDonationsResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${fundTransactionsTable.amount}), 0)`
      })
      .from(fundTransactionsTable)
      .where(and(...fundConditions))
      .execute();

    const totalDonations = parseFloat(totalDonationsResult[0]?.total || '0');

    // Get funds by type
    const fundsByTypeResult = await db
      .select({
        fund_type: fundTransactionsTable.fund_type,
        total: sql<string>`COALESCE(SUM(${fundTransactionsTable.amount}), 0)`
      })
      .from(fundTransactionsTable)
      .where(and(...fundConditions))
      .groupBy(fundTransactionsTable.fund_type)
      .execute();

    const fundsByType: Record<string, number> = {};
    fundsByTypeResult.forEach(row => {
      fundsByType[row.fund_type] = parseFloat(row.total);
    });

    // Get total expenses from material sales
    const totalExpensesResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${materialDistributionsTable.price}), 0)`
      })
      .from(materialDistributionsTable)
      .where(and(
        ...materialConditions,
        eq(materialDistributionsTable.is_sale, true)
      ))
      .execute();

    const totalExpenses = parseFloat(totalExpensesResult[0]?.total || '0');

    // Get monthly trends for payments
    const monthlyPaymentsResult = await db
      .select({
        month: sql<string>`TO_CHAR(${paymentsTable.paid_date}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)`
      })
      .from(paymentsTable)
      .where(and(
        ...paymentConditions,
        eq(paymentsTable.status, 'paid')
      ))
      .groupBy(sql`TO_CHAR(${paymentsTable.paid_date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${paymentsTable.paid_date}, 'YYYY-MM')`)
      .execute();

    // Get monthly trends for donations
    const monthlyDonationsResult = await db
      .select({
        month: sql<string>`TO_CHAR(${fundTransactionsTable.transaction_date}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${fundTransactionsTable.amount}), 0)`
      })
      .from(fundTransactionsTable)
      .where(and(...fundConditions))
      .groupBy(sql`TO_CHAR(${fundTransactionsTable.transaction_date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${fundTransactionsTable.transaction_date}, 'YYYY-MM')`)
      .execute();

    // Combine monthly trends
    const monthlyTrendsMap = new Map<string, { payments: number; donations: number }>();

    monthlyPaymentsResult.forEach(row => {
      if (row.month) {
        monthlyTrendsMap.set(row.month, {
          payments: parseFloat(row.total),
          donations: monthlyTrendsMap.get(row.month)?.donations || 0
        });
      }
    });

    monthlyDonationsResult.forEach(row => {
      if (row.month) {
        const existing = monthlyTrendsMap.get(row.month);
        monthlyTrendsMap.set(row.month, {
          payments: existing?.payments || 0,
          donations: parseFloat(row.total)
        });
      }
    });

    const monthlyTrends = Array.from(monthlyTrendsMap.entries()).map(([month, data]) => ({
      month,
      payments: data.payments,
      donations: data.donations
    }));

    return {
      studyCenterId,
      totalPayments,
      totalDonations,
      totalExpenses,
      paymentsByStatus,
      fundsByType,
      monthlyTrends
    };

  } catch (error) {
    console.error('Financial report generation failed:', error);
    throw error;
  }
}
import { prisma } from "@/lib/prisma";
import {
  buildRecurringDate,
  formatRecurringMonth,
  shouldGenerateForMonth,
} from "@/lib/recurring";

/**
 * Đồng bộ và tự sinh các giao dịch định kỳ đến hạn trong tháng hiện tại cho user.
 * Đảm bảo idempotent nhờ lastGeneratedYear/Month và unique [recurringId, recurringMonth].
 */
export async function syncRecurringTransactions(
  userId: string,
  now: Date = new Date()
): Promise<number> {
  const activeRules = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      isActive: true,
    },
  });

  const dueRules = activeRules.filter((rule) =>
    shouldGenerateForMonth(rule, now)
  );

  if (dueRules.length === 0) {
    return 0;
  }

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const recurringMonth = formatRecurringMonth(year, month);

  return prisma.$transaction(async (tx) => {
    const created = await tx.transaction.createMany({
      data: dueRules.map((rule) => ({
        userId,
        type: rule.type,
        amount: rule.amount,
        description: rule.description,
        category: rule.category,
        date: buildRecurringDate(year, month, rule.dayOfMonth),
        recurringId: rule.id,
        recurringMonth,
      })),
      skipDuplicates: true,
    });

    await tx.recurringTransaction.updateMany({
      where: {
        id: { in: dueRules.map((rule) => rule.id) },
        userId,
      },
      data: {
        lastGeneratedYear: year,
        lastGeneratedMonth: month,
      },
    });

    return created.count;
  });
}
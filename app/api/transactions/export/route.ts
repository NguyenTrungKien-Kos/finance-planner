import { NextResponse, type NextRequest } from "next/server";
import { CATEGORIES, TRANSACTION_TYPES } from "@/lib/constants";
import { transactionsToCsv } from "@/lib/csv";
import { requireUser, UnauthorizedError } from "@/lib/dal";
import { getDateRange } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

function buildExportFilename(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `transactions-${y}-${m}-${d}.csv`;
}

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { searchParams } = request.nextUrl;
  const rawPeriod = searchParams.get("period") ?? undefined;
  const period =
    rawPeriod === "this_month" || rawPeriod === "last_month"
      ? rawPeriod
      : "all";

  const rawType = searchParams.get("type");
  const validType = TRANSACTION_TYPES.includes(
    rawType as (typeof TRANSACTION_TYPES)[number]
  )
    ? (rawType as (typeof TRANSACTION_TYPES)[number])
    : undefined;

  const rawCategory = searchParams.get("category");
  const validCategory = CATEGORIES.includes(
    rawCategory as (typeof CATEGORIES)[number]
  )
    ? (rawCategory as (typeof CATEGORIES)[number])
    : undefined;

  const dateRange = getDateRange(period);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(validType ? { type: validType } : {}),
      ...(validCategory ? { category: validCategory } : {}),
      ...(dateRange ? { date: dateRange } : {}),
    },
    select: {
      date: true,
      type: true,
      category: true,
      amount: true,
      description: true,
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const csvContent = transactionsToCsv(transactions);
  const filename = buildExportFilename();

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
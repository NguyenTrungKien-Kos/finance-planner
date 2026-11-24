import { NextResponse, type NextRequest } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/dal";
import { CATEGORIES, TRANSACTION_TYPES } from "@/lib/constants";
import { getDateRange } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

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
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ transactions });
}
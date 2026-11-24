import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/dal";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TRANSACTION_TYPES,
} from "@/lib/constants";
import { calculateSummary, getDateRange } from "@/lib/finance";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransactionDialog } from "@/components/transaction-dialog";
import { TransactionFilters } from "@/components/transaction-filters";
import { UserNav } from "@/components/user-nav";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

function pickSingle(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  await connection();

  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw err;
  }

  const params = await searchParams;

  const rawPeriod = pickSingle(params.period);
  const period =
    rawPeriod === "this_month" || rawPeriod === "last_month"
      ? rawPeriod
      : "all";

  const rawType = pickSingle(params.type);
  const validType = TRANSACTION_TYPES.includes(
    rawType as (typeof TRANSACTION_TYPES)[number]
  )
    ? (rawType as (typeof TRANSACTION_TYPES)[number])
    : undefined;

  const rawCategory = pickSingle(params.category);
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

  const { totalIncome, totalExpense, balance } = calculateSummary(transactions);

  return (
    <>
      <section
        aria-label="Thống kê tài chính"
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số dư hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatVND(balance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatVND(totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng chi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatVND(totalExpense)}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            Lịch sử giao dịch ({transactions.length} mục)
          </CardTitle>
          <TransactionFilters
            period={period}
            type={validType ?? "ALL"}
            category={validCategory ?? "ALL"}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Chưa có giao dịch nào khớp bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[tx.category] ?? tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.type === "INCOME" ? "default" : "secondary"
                        }
                      >
                        {tx.type === "INCOME" ? "Thu" : "Chi"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-medium whitespace-nowrap ${
                        tx.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {formatVND(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <TransactionDialog
                          mode="edit"
                          transaction={{
                            id: tx.id,
                            amount: tx.amount,
                            description: tx.description,
                            type: tx.type,
                            category: tx.category,
                            date: formatDateInput(tx.date),
                          }}
                        />
                        <DeleteTransactionButton
                          id={tx.id}
                          description={tx.description}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

async function HeaderUser() {
  await connection();
  let user: { name: string; email: string } | null = null;
  try {
    user = await requireUser();
  } catch {
    return null;
  }
  return <UserNav name={user.name} email={user.email} />;
}

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Planner</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thu chi cá nhân
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TransactionDialog mode="create" />
          <ThemeToggle />
          <Suspense fallback={null}>
            <HeaderUser />
          </Suspense>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">
            Đang tải dữ liệu giao dịch...
          </div>
        }
      >
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
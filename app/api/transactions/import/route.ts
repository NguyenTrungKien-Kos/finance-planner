import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { MAX_CSV_FILE_SIZE_BYTES, parseTransactionsCsv } from "@/lib/csv";
import { requireUser, UnauthorizedError } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const ALLOWED_MIME_TYPES = new Set([
  "",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
]);

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu tải lên phải ở định dạng multipart/form-data." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Vui lòng chọn tệp CSV cần nhập." },
      { status: 400 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json(
      { error: "Chỉ hỗ trợ tệp có phần mở rộng .csv." },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Định dạng MIME của tệp không hợp lệ cho CSV." },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "Tệp CSV đang trống." },
      { status: 400 }
    );
  }

  if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Dung lượng tệp CSV vượt quá giới hạn 1 MB." },
      { status: 400 }
    );
  }

  const csvText = await file.text();
  const parsed = parseTransactionsCsv(csvText);

  if (!parsed.ok) {
    return NextResponse.json(
      {
        error: parsed.error,
        rowErrors: parsed.rowErrors,
      },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.transaction.createMany({
      data: parsed.rows.map((row) => ({
        userId: user.id,
        date: row.date,
        type: row.type,
        category: row.category,
        amount: row.amount,
        description: row.description,
      })),
    });

    revalidatePath("/");

    return NextResponse.json(
      {
        importedCount: result.count,
        message: `Đã nhập thành công ${result.count} giao dịch từ CSV.`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể lưu dữ liệu CSV vào cơ sở dữ liệu." },
      { status: 500 }
    );
  }
}
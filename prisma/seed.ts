import "dotenv/config";
import {
  PrismaClient,
  TransactionType,
  Category,
  Priority,
} from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(12, 0, 0, 0);
  return d;
}

function lastMonthDay(day: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, day, 12, 0, 0, 0);
}

function thisMonthDay(day: number): Date {
  const now = new Date();
  const safeDay = Math.min(day, now.getDate());
  return new Date(now.getFullYear(), now.getMonth(), safeDay, 12, 0, 0, 0);
}

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@financeplanner.local" },
    update: { name: "Demo User" },
    create: {
      name: "Demo User",
      email: "demo@financeplanner.local",
      emailVerified: true,
    },
  });

  // Dọn dữ liệu cũ của demoUser để seed lại nhiều lần không bị nhân đôi
  await prisma.transaction.deleteMany({ where: { userId: demoUser.id } });
  await prisma.wishlistItem.deleteMany({ where: { userId: demoUser.id } });

  const transactions: {
    userId: string;
    type: TransactionType;
    amount: number;
    description: string;
    category: Category;
    date: Date;
  }[] = [
    // --- THÁNG HIỆN TẠI (16 giao dịch) ---
    {
      userId: demoUser.id,
      type: TransactionType.INCOME,
      amount: 18500000,
      description: "Lương tháng hiện tại",
      category: Category.SALARY,
      date: thisMonthDay(5),
    },
    {
      userId: demoUser.id,
      type: TransactionType.INCOME,
      amount: 2400000,
      description: "Cổ tức quỹ ETF",
      category: Category.INVESTMENT,
      date: thisMonthDay(10),
    },
    {
      userId: demoUser.id,
      type: TransactionType.INCOME,
      amount: 1200000,
      description: "Thưởng dự án nhỏ",
      category: Category.OTHER,
      date: thisMonthDay(15),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 3500000,
      description: "Tiền thuê phòng",
      category: Category.BILLS,
      date: thisMonthDay(2),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 650000,
      description: "Tiền điện nước & Internet",
      category: Category.BILLS,
      date: thisMonthDay(6),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 185000,
      description: "Cơm trưa và cà phê",
      category: Category.FOOD,
      date: daysAgo(1),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 420000,
      description: "Đi siêu thị thực phẩm tuần",
      category: Category.FOOD,
      date: daysAgo(3),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 95000,
      description: "Đổ xăng xe máy",
      category: Category.TRANSPORT,
      date: daysAgo(2),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 140000,
      description: "Đặt xe công nghệ",
      category: Category.TRANSPORT,
      date: daysAgo(5),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 260000,
      description: "Xem phim cuối tuần",
      category: Category.ENTERTAINMENT,
      date: daysAgo(4),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 199000,
      description: "Gia hạn gói nghe nhạc & lưu trữ",
      category: Category.ENTERTAINMENT,
      date: thisMonthDay(8),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 890000,
      description: "Mua áo khoác đi làm",
      category: Category.SHOPPING,
      date: thisMonthDay(12),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 320000,
      description: "Mua sách kỹ thuật",
      category: Category.SHOPPING,
      date: thisMonthDay(14),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 150000,
      description: "Ăn tối cùng bạn",
      category: Category.FOOD,
      date: thisMonthDay(16),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 250000,
      description: "Gửi tiền mừng sinh nhật",
      category: Category.OTHER,
      date: thisMonthDay(18),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 120000,
      description: "Rửa xe & bảo dưỡng nhẹ",
      category: Category.TRANSPORT,
      date: thisMonthDay(19),
    },

    // --- THÁNG TRƯỚC (16 giao dịch) ---
    {
      userId: demoUser.id,
      type: TransactionType.INCOME,
      amount: 18000000,
      description: "Lương tháng trước",
      category: Category.SALARY,
      date: lastMonthDay(5),
    },
    {
      userId: demoUser.id,
      type: TransactionType.INCOME,
      amount: 1800000,
      description: "Lãi tiết kiệm & đầu tư",
      category: Category.INVESTMENT,
      date: lastMonthDay(12),
    },
    {
      userId: demoUser.id,
      type: TransactionType.INCOME,
      amount: 750000,
      description: "Hoàn tiền thẻ & bán đồ cũ",
      category: Category.OTHER,
      date: lastMonthDay(20),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 3500000,
      description: "Tiền thuê phòng tháng trước",
      category: Category.BILLS,
      date: lastMonthDay(2),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 610000,
      description: "Điện nước & Internet tháng trước",
      category: Category.BILLS,
      date: lastMonthDay(7),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 450000,
      description: "Đi chợ thực phẩm đầu tháng",
      category: Category.FOOD,
      date: lastMonthDay(4),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 220000,
      description: "Ăn trưa văn phòng",
      category: Category.FOOD,
      date: lastMonthDay(11),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 380000,
      description: "Siêu thị cuối tuần",
      category: Category.FOOD,
      date: lastMonthDay(22),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 100000,
      description: "Đổ xăng xe",
      category: Category.TRANSPORT,
      date: lastMonthDay(9),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 180000,
      description: "Di chuyển sân bay / nội thành",
      category: Category.TRANSPORT,
      date: lastMonthDay(24),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 340000,
      description: "Cà phê & boardgame cuối tuần",
      category: Category.ENTERTAINMENT,
      date: lastMonthDay(14),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 199000,
      description: "Thuê phim & giải trí",
      category: Category.ENTERTAINMENT,
      date: lastMonthDay(26),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 1250000,
      description: "Mua bàn phím cơ làm việc",
      category: Category.SHOPPING,
      date: lastMonthDay(16),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 540000,
      description: "Đồ dùng gia đình",
      category: Category.SHOPPING,
      date: lastMonthDay(25),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 300000,
      description: "Khám sức khỏe định kỳ",
      category: Category.OTHER,
      date: lastMonthDay(18),
    },
    {
      userId: demoUser.id,
      type: TransactionType.EXPENSE,
      amount: 165000,
      description: "Gửi xe tháng",
      category: Category.TRANSPORT,
      date: lastMonthDay(27),
    },
  ];

  await prisma.transaction.createMany({ data: transactions });

  await prisma.wishlistItem.createMany({
    data: [
      {
        userId: demoUser.id,
        name: "Tai nghe chống ồn",
        cost: 4500000,
        priority: Priority.HIGH,
      },
      {
        userId: demoUser.id,
        name: "Màn hình rời 27 inch",
        cost: 7800000,
        priority: Priority.MEDIUM,
      },
      {
        userId: demoUser.id,
        name: "Chuyến du lịch Đà Lạt",
        cost: 6000000,
        priority: Priority.LOW,
      },
    ],
  });

  console.log(
    `Seeded ${transactions.length} transactions and 3 wishlist items for ${demoUser.email}`
  );
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
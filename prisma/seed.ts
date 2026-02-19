import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hash password for all seeded users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // -------------------------
  // ADMIN USER
  // -------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@library.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@library.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // -------------------------
  // NORMAL USERS
  // -------------------------
  const user1 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@example.com",
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      name: "Jane Smith",
      email: "jane@example.com",
      password: hashedPassword,
    },
  });

  // -------------------------
  // BOOKS
  // -------------------------
  const book1 = await prisma.book.create({
    data: {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      publisher: "Scribner",
      copies: 3,
      isAvailable: true,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      title: "1984",
      author: "George Orwell",
      publisher: "Secker & Warburg",
      copies: 5,
      isAvailable: true,
    },
  });

  const book3 = await prisma.book.create({
    data: {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      publisher: "J.B. Lippincott & Co.",
      copies: 2,
      isAvailable: true,
    },
  });

  // -------------------------
  // BORROW RECORD
  // -------------------------
  await prisma.borrow.create({
    data: {
      userId: user1.id,
      bookId: book1.id,
      dueDate: new Date(
        new Date().setDate(new Date().getDate() + 14)
      ),
    },
  });

  console.log("✅ Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_QUESTION_TEMPLATES = [
  {
    questionText: "এই প্রোডাক্টের ডিজাইন আপনার কেমন লাগলো?",
    questionType: "multiple_choice" as const,
    options: JSON.stringify(["খুব ভালো", "ভালো", "মোটামুটি", "ভালো লাগেনি"]),
    displayOrder: 1,
  },
  {
    questionText: "কোন কোন বিষয়গুলো আপনার সবচেয়ে ভালো লেগেছে?",
    questionType: "checkbox" as const,
    options: JSON.stringify(["দাম", "মান/কাপড়", "ডিজাইন", "প্যাকেজিং"]),
    displayOrder: 2,
  },
  {
    questionText: "প্রোডাক্টটি নিয়ে আপনার মন্তব্য লিখুন",
    questionType: "text" as const,
    options: null,
    displayOrder: 3,
  },
  {
    questionText: "প্রোডাক্টের সামগ্রিক মান কেমন?",
    questionType: "rating" as const,
    options: null,
    displayOrder: 4,
  },
  {
    questionText: "এই প্রোডাক্টের জন্য আপনি কত টাকা যুক্তিসঙ্গত মনে করেন?",
    questionType: "price_opinion" as const,
    options: JSON.stringify({ min: 0, max: 5000, step: 50 }),
    displayOrder: 5,
  },
  {
    questionText: "আপনি কি এই প্রোডাক্টটি কিনবেন?",
    questionType: "purchase_intent" as const,
    options: null,
    displayOrder: 6,
  },
];

const PRODUCTS = [
  { image: "/products/product-1.jpg", title: "ব্রাউন খিমার আবায়া সেট" },
  { image: "/products/product-2.jpg", title: "টেক্সচার্ড আবায়া (ব্রাউন)" },
  { image: "/products/product-3.jpg", title: "ফ্রিঞ্জ কাফ আবায়া (ব্ল্যাক)" },
  { image: "/products/product-4.jpg", title: "ব্ল্যাক নিকাব সেট" },
  { image: "/products/product-5.jpg", title: "গোল্ড এমব্রয়ডারি আবায়া (ব্ল্যাক)" },
  { image: "/products/product-6.jpg", title: "স্কাই ব্লু এমব্রয়ডারি গাউন" },
  { image: "/products/product-7.jpg", title: "মভ খিমার আবায়া সেট" },
  { image: "/products/product-8.jpg", title: "পিংক লেইস লেয়ার্ড ড্রেস" },
];

async function main() {
  // Never hardcode the admin password: this repository is public and the admin
  // login is reachable from the internet. Supply it via the environment.
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Add it to .env (or pass it inline) before seeding.",
    );
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", passwordHash },
  });

  const existingTemplateCount = await prisma.questionTemplate.count();
  if (existingTemplateCount === 0) {
    await prisma.questionTemplate.createMany({ data: DEFAULT_QUESTION_TEMPLATES });
  }
  const templates = await prisma.questionTemplate.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const existingProductCount = await prisma.product.count();
  if (existingProductCount === 0) {
    for (const [index, p] of PRODUCTS.entries()) {
      await prisma.product.create({
        data: {
          title: p.title,
          image: p.image,
          isActive: true,
          displayOrder: index + 1,
          questions: {
            create: templates.map((t) => ({
              questionText: t.questionText,
              questionType: t.questionType,
              options: t.options,
              displayOrder: t.displayOrder,
            })),
          },
        },
      });
    }
  }

  const existingAnnouncement = await prisma.announcement.findFirst();
  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        message: "৫০০+ মানুষ ইতিমধ্যে অংশগ্রহণ করেছেন — ফিডব্যাক দিয়ে জিতে নিন বিশেষ গিফট!",
        isActive: true,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

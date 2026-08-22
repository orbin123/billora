import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcrypt";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

type BillLine = {
  foodName: string;
  quantity: number;
};

const money = (value: number) => value.toFixed(2);

async function main() {
  // Delete children first to respect the foreign-key relationships in the ERD.
  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.food.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("admin123", 12);
  await prisma.user.createMany({
    data: [
      { name: "Aarav Sharma", password, role: "admin" },
      { name: "Priya Nair", password, role: "admin" },
    ],
  });

  const rice = await prisma.category.create({
    data: { name: "Rice", description: "Freshly cooked rice dishes" },
  });
  const fish = await prisma.category.create({
    data: { name: "Fish", description: "Fresh fish and seafood" },
  });
  const curry = await prisma.category.create({
    data: { name: "Curry", description: "House-special curries" },
  });
  const egg = await prisma.category.create({
    data: { name: "Egg", description: "Egg-based sides and curries" },
  });
  const drinks = await prisma.category.create({
    data: { name: "Drinks", description: "Cold beverages and refreshments" },
  });

  const foods = await Promise.all([
    prisma.food.create({ data: { categoryId: rice.id, name: "Rice", price: money(70) } }),
    prisma.food.create({ data: { categoryId: rice.id, name: "Ghee Rice", price: money(90) } }),
    prisma.food.create({ data: { categoryId: rice.id, name: "Curd Rice", price: money(50) } }),
    prisma.food.create({ data: { categoryId: rice.id, name: "Parota", price: money(20) } }),
    prisma.food.create({ data: { categoryId: fish.id, name: "Fish Fry", price: money(130) } }),
    prisma.food.create({ data: { categoryId: fish.id, name: "Fish Curry", price: money(140) } }),
    prisma.food.create({ data: { categoryId: curry.id, name: "Chicken Curry", price: money(120) } }),
    prisma.food.create({ data: { categoryId: curry.id, name: "Mutton Curry", price: money(180) } }),
    prisma.food.create({ data: { categoryId: curry.id, name: "Paneer Butter Masala", price: money(150) } }),
    prisma.food.create({ data: { categoryId: egg.id, name: "Egg Curry", price: money(25) } }),
    prisma.food.create({ data: { categoryId: egg.id, name: "Boiled Egg", price: money(20) } }),
    prisma.food.create({ data: { categoryId: egg.id, name: "Omelette", price: money(50) } }),
    prisma.food.create({ data: { categoryId: drinks.id, name: "Tea", price: money(15) } }),
    prisma.food.create({ data: { categoryId: drinks.id, name: "Lime Juice", price: money(25) } }),
    prisma.food.create({ data: { categoryId: drinks.id, name: "Mineral Water", price: money(20) } }),
  ]);

  const foodsByName = new Map(foods.map((food) => [food.name, food]));
  const today = new Date();
  const dayStamp = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("");
  const atToday = (hours: number, minutes: number) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

  const createBill = async (
    billNumber: string,
    paymentMethod: string,
    paymentStatus: string,
    createdAt: Date,
    lines: BillLine[],
  ) => {
    const items = lines.map(({ foodName, quantity }) => {
      const food = foodsByName.get(foodName);
      if (!food) throw new Error(`Seed food not found: ${foodName}`);

      const price = Number(food.price);
      return {
        foodId: food.id,
        foodName: food.name,
        price: money(price),
        quantity,
        total: money(price * quantity),
      };
    });
    const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);

    return prisma.bill.create({
      data: {
        billNumber,
        subtotal: money(subtotal),
        grandTotal: money(subtotal),
        paymentMethod,
        paymentStatus,
        createdAt,
        items: { create: items },
      },
    });
  };

  await createBill(`BIL-${dayStamp}-001`, "Cash", "PAID", atToday(9, 35), [
    { foodName: "Rice", quantity: 2 },
    { foodName: "Chicken Curry", quantity: 2 },
    { foodName: "Fish Fry", quantity: 1 },
    { foodName: "Egg Curry", quantity: 1 },
    { foodName: "Tea", quantity: 2 },
  ]);

  await createBill(`BIL-${dayStamp}-002`, "UPI", "PAID", atToday(12, 50), [
    { foodName: "Ghee Rice", quantity: 2 },
    { foodName: "Fish Curry", quantity: 2 },
    { foodName: "Parota", quantity: 3 },
    { foodName: "Omelette", quantity: 2 },
    { foodName: "Lime Juice", quantity: 3 },
    { foodName: "Mineral Water", quantity: 2 },
  ]);

  await createBill(`BIL-${dayStamp}-003`, "Card", "PAID", atToday(19, 20), [
    { foodName: "Curd Rice", quantity: 2 },
    { foodName: "Mutton Curry", quantity: 2 },
    { foodName: "Paneer Butter Masala", quantity: 1 },
    { foodName: "Boiled Egg", quantity: 4 },
    { foodName: "Fish Fry", quantity: 1 },
    { foodName: "Tea", quantity: 2 },
    { foodName: "Mineral Water", quantity: 3 },
  ]);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

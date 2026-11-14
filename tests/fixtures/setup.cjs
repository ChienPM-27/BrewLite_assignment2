'use strict';

/**
 * Setup fixture E2E (ADR-009 mục 3.6): tạo món, 3 size, công thức theo từng size, topping và
 * nguyên liệu RIÊNG cho một runId, tên mang tiền tố e2e_<runId>. Không đọc/sửa/xóa dữ liệu seed.
 *
 * Kết quả in ra stdout đúng một dòng `E2E_MANIFEST=<json>`; lệnh e2e:local ghi dòng đó vào
 * tests/.e2e-run/<runId>/manifest.json để Playwright và teardown dùng.
 */

const { PrismaClient } = require('@prisma/client');
const { assertE2eDatabase, log, namesFor, requireRunId } = require('./lib.cjs');

// Giá cố định (VNĐ) để test tính được số tiền mong đợi.
const BASE_PRICE = 30000;
const SIZE_PRICES = { S: 0, M: 5000, L: 10000 };
const TOPPING_PRICE = 7000;
// Đủ cho các kịch bản và lần retry; nguyên liệu riêng nên không đụng tồn kho demo.
const INGREDIENT_STOCK = 100000;
// Thiếu công thức cho size được chọn thì API trả 400 (AC-14.8), nên tạo đủ S/M/L.
const PRODUCT_RECIPES = {
  S: { coffee: 18, milk: 30 },
  M: { coffee: 20, milk: 40 },
  L: { coffee: 25, milk: 50 },
};
const TOPPING_RECIPE_QUANTITY = 30;

async function main() {
  const runId = requireRunId();
  assertE2eDatabase();
  const names = namesFor(runId);
  const prisma = new PrismaClient();

  try {
    const clash = await prisma.product.count({ where: { name: names.productName } });
    if (clash > 0) {
      throw new Error(`runId ${runId} đã có fixture. Chạy teardown trước hoặc dùng runId khác.`);
    }

    // Một transaction: lỗi giữa chừng thì không để lại bản ghi dở dang.
    const manifest = await prisma.$transaction(async (tx) => {
      const createIngredient = (name, unit) =>
        tx.ingredient.create({
          data: { name, unit, stock: INGREDIENT_STOCK, minThreshold: 0, isAvailable: true },
        });
      const coffee = await createIngredient(names.ingredients.coffee, 'g');
      const milk = await createIngredient(names.ingredients.milk, 'ml');
      const pearl = await createIngredient(names.ingredients.pearl, 'g');

      const product = await tx.product.create({
        data: {
          name: names.productName,
          basePrice: BASE_PRICE,
          // Cột stock đã deprecated nhưng API Menu vẫn lọc stock > 0 (ProductsService).
          stock: 1000,
          isAvailable: true,
          sizePrices: {
            create: Object.entries(SIZE_PRICES).map(([size, priceAdjustment]) => ({
              size,
              priceAdjustment,
            })),
          },
          recipes: {
            create: Object.entries(PRODUCT_RECIPES).flatMap(([size, recipe]) => [
              { size, ingredientId: coffee.id, quantity: recipe.coffee },
              { size, ingredientId: milk.id, quantity: recipe.milk },
            ]),
          },
        },
      });

      // Không có bảng ProductTopping: API chi tiết món trả mọi topping đang bán.
      const topping = await tx.topping.create({
        data: {
          name: names.toppingName,
          price: TOPPING_PRICE,
          stock: 1000,
          isAvailable: true,
          recipes: {
            create: [{ ingredientId: pearl.id, quantity: TOPPING_RECIPE_QUANTITY }],
          },
        },
      });

      return {
        version: 1,
        runId,
        createdAt: new Date().toISOString(),
        emailPrefix: names.emailPrefix,
        product: {
          id: product.id,
          name: product.name,
          basePrice: BASE_PRICE,
          sizePrices: SIZE_PRICES,
        },
        topping: { id: topping.id, name: topping.name, price: TOPPING_PRICE },
        ingredients: [coffee, milk, pearl].map((item) => ({ id: item.id, name: item.name })),
      };
    });

    process.stdout.write(`E2E_MANIFEST=${JSON.stringify(manifest)}\n`);
    log(
      `Đã tạo fixture runId=${runId}: món ${manifest.product.id}, topping ${manifest.topping.id}, ` +
        `${manifest.ingredients.length} nguyên liệu.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  log('Setup thất bại:', error && error.message ? error.message : error);
  process.exit(1);
});

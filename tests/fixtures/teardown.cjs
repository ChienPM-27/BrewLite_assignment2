'use strict';

/**
 * Teardown fixture E2E (ADR-009 mục 3.6). Lệnh e2e:local luôn gọi script này trong `finally`.
 *
 * Manifest của lượt chạy gồm:
 *  - manifest.json: ID món, topping, nguyên liệu do setup tạo;
 *  - created.jsonl: ID user, đơn, giao dịch Playwright tạo qua UI.
 * Chỉ xóa theo các ID đó, theo thứ tự khóa ngoại:
 *   LoyaltyTransaction → Order (cascade OrderItem, OrderItemTopping, Payment, OrderStatusHistory,
 *   OrderIngredientUsage) → User → Product (cascade ProductSizePrice, ProductRecipe)
 *   → Topping (cascade ToppingRecipe) → Ingredient.
 * Danh mục fixture bị dữ liệu ngoài lượt chạy tham chiếu thì dừng phần dọn đó và báo lỗi.
 * Sau khi xóa, kiểm tra không còn user/đơn/giao dịch/fixture của runId; còn sót hoặc có lỗi thì exit 1.
 *
 * Kết quả in ra stdout một dòng `E2E_TEARDOWN=<json>`.
 */

const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const {
  assertE2eDatabase,
  log,
  namesFor,
  readJsonIfExists,
  readJsonLines,
  requireRunId,
  runDirFor,
} = require('./lib.cjs');

async function main() {
  const runId = requireRunId();
  assertE2eDatabase();
  const names = namesFor(runId);
  const runDir = runDirFor(runId);
  const manifest = readJsonIfExists(path.join(runDir, 'manifest.json'));
  const created = readJsonLines(path.join(runDir, 'created.jsonl'));
  const problems = [];

  if (manifest && manifest.runId !== runId) {
    throw new Error(`Manifest thuộc runId ${manifest.runId}, không khớp ${runId}.`);
  }

  const prisma = new PrismaClient();
  try {
    // 1. User và đơn do Playwright ghi nhận.
    const recordedUserIds = created.filter((entry) => entry.type === 'user').map((entry) => entry.id);
    const recordedOrderIds = created.filter((entry) => entry.type === 'order').map((entry) => entry.id);

    const recordedUsers = await prisma.user.findMany({
      where: { id: { in: recordedUserIds } },
      select: { id: true, email: true, role: true },
    });
    const users = recordedUsers.filter(
      (user) => user.role === 'CUSTOMER' && user.email.startsWith(names.emailPrefix),
    );
    if (users.length !== recordedUsers.length) {
      problems.push('Có user trong manifest không phải CUSTOMER của runId này; không xóa user đó.');
    }
    const userIds = users.map((user) => user.id);

    const orders = await prisma.order.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, orderNumber: true, status: true },
    });
    const orderIds = orders.map((order) => order.id);
    const unknownOrders = recordedOrderIds.filter((id) => !orderIds.includes(id));
    if (unknownOrders.length > 0) {
      const stillExists = await prisma.order.count({ where: { id: { in: unknownOrders } } });
      if (stillExists > 0) {
        problems.push(`${stillExists} đơn trong manifest không thuộc user của lượt chạy; không xóa.`);
      }
    }

    // 2. Danh mục fixture theo ID trong manifest.json, tên phải mang tiền tố của runId.
    let catalogDeletable = false;
    let ingredientIds = [];
    if (manifest) {
      ingredientIds = manifest.ingredients.map((item) => item.id);
      const expectedIngredientNames = Object.values(names.ingredients);
      const namesMatch =
        manifest.product.name === names.productName &&
        manifest.topping.name === names.toppingName &&
        manifest.ingredients.every((item) => expectedIngredientNames.includes(item.name));
      if (!namesMatch) {
        problems.push('manifest.json chứa bản ghi không mang tên theo runId; không xóa danh mục.');
      }

      const foreignReferences = {
        orderItems: await prisma.orderItem.count({
          where: { productId: manifest.product.id, orderId: { notIn: orderIds } },
        }),
        orderItemToppings: await prisma.orderItemTopping.count({
          where: { toppingId: manifest.topping.id, orderItem: { orderId: { notIn: orderIds } } },
        }),
        ingredientUsages: await prisma.orderIngredientUsage.count({
          where: { ingredientId: { in: ingredientIds }, orderId: { notIn: orderIds } },
        }),
        productRecipes: await prisma.productRecipe.count({
          where: { ingredientId: { in: ingredientIds }, productId: { not: manifest.product.id } },
        }),
        toppingRecipes: await prisma.toppingRecipe.count({
          where: { ingredientId: { in: ingredientIds }, toppingId: { not: manifest.topping.id } },
        }),
      };
      const referenced = Object.entries(foreignReferences).filter(([, count]) => count > 0);
      if (referenced.length > 0) {
        problems.push(
          'Danh mục fixture đang bị dữ liệu ngoài lượt chạy tham chiếu (' +
            referenced.map(([key, count]) => `${key}=${count}`).join(', ') +
            '); dừng phần dọn danh mục.',
        );
      }
      catalogDeletable = namesMatch && referenced.length === 0;
    }

    // 3. Xóa trong một transaction, mọi điều kiện theo ID đã xác định ở trên.
    const deleted = await prisma.$transaction(async (tx) => {
      const result = {
        loyaltyTransactions: (
          await tx.loyaltyTransaction.deleteMany({
            where: { OR: [{ userId: { in: userIds } }, { orderId: { in: orderIds } }] },
          })
        ).count,
        orders: (await tx.order.deleteMany({ where: { id: { in: orderIds } } })).count,
        users: (await tx.user.deleteMany({ where: { id: { in: userIds } } })).count,
        products: 0,
        toppings: 0,
        ingredients: 0,
      };
      if (catalogDeletable) {
        result.products = (await tx.product.deleteMany({ where: { id: manifest.product.id } })).count;
        result.toppings = (await tx.topping.deleteMany({ where: { id: manifest.topping.id } })).count;
        result.ingredients = (
          await tx.ingredient.deleteMany({ where: { id: { in: ingredientIds } } })
        ).count;
      }
      return result;
    });

    // 4. Kiểm tra không còn dữ liệu của runId (kể cả bản ghi không có trong manifest).
    const allOrderIds = [...new Set([...orderIds, ...recordedOrderIds])];
    const recordedPaymentIds = created
      .filter((entry) => entry.type === 'payment')
      .map((entry) => entry.id);
    const remaining = {
      users: await prisma.user.count({ where: { email: { startsWith: names.emailPrefix } } }),
      orders: await prisma.order.count({ where: { id: { in: allOrderIds } } }),
      // Giao dịch bị xóa theo cascade của đơn; vẫn kiểm theo ID đã ghi và theo đơn của lượt chạy.
      payments: await prisma.payment.count({
        where: { OR: [{ id: { in: recordedPaymentIds } }, { orderId: { in: allOrderIds } }] },
      }),
      products: await prisma.product.count({ where: { name: { startsWith: names.prefix } } }),
      toppings: await prisma.topping.count({ where: { name: { startsWith: names.prefix } } }),
      ingredients: await prisma.ingredient.count({ where: { name: { startsWith: names.prefix } } }),
    };
    const leftovers = Object.entries(remaining).filter(([, count]) => count > 0);
    if (leftovers.length > 0) {
      problems.push(
        'Còn sót sau teardown: ' + leftovers.map(([key, count]) => `${key}=${count}`).join(', '),
      );
    }

    const summary = {
      runId,
      orders: orders.map((order) => ({ orderNumber: order.orderNumber, status: order.status })),
      deleted,
      remaining,
      problems,
    };
    process.stdout.write(`E2E_TEARDOWN=${JSON.stringify(summary)}\n`);

    if (problems.length > 0) {
      problems.forEach((problem) => log('LỖI:', problem));
      process.exitCode = 1;
    } else {
      log(
        `Đã dọn sạch runId=${runId}: ${deleted.users} user, ${deleted.orders} đơn, ` +
          `${deleted.products} món, ${deleted.toppings} topping, ${deleted.ingredients} nguyên liệu.`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  log('Teardown thất bại:', error && error.message ? error.message : error);
  process.exit(1);
});

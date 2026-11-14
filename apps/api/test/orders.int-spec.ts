import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrderStatus, ProductSize } from '@prisma/client';
import * as request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import {
  cleanupTestData,
  createNestTestApp,
  generateTestIdentifier,
  TestDataRegistry,
} from './test-helper';

jest.setTimeout(30_000);

type RecipeInput = {
  ingredientId: string;
  quantity: number;
  size?: ProductSize;
};

type OrderPayload = {
  items?: Array<{
    productId: string;
    size?: ProductSize;
    quantity: number;
    toppingIds?: string[];
  }>;
  promotionCode?: string;
  [key: string]: unknown;
};

describe('Orders API Integration Tests (SP2-06 / FR-13..16 & FR-21)', () => {
  let app: INestApplication | null = null;
  let prisma: PrismaService | null = null;
  let jwtService: JwtService | null = null;

  const registry: TestDataRegistry = {
    userIds: [],
    productIds: [],
    orderIds: [],
    paymentIds: [],
    promotionIds: [],
    ingredientIds: [],
  };

  function db(): PrismaService {
    if (!prisma) {
      throw new Error('PrismaService has not been initialized.');
    }
    return prisma;
  }

  function httpServer() {
    if (!app) {
      throw new Error('Nest application has not been initialized.');
    }
    return app.getHttpServer();
  }

  function jwt(): JwtService {
    if (!jwtService) {
      throw new Error('JwtService has not been initialized.');
    }
    return jwtService;
  }

  beforeAll(async () => {
    app = await createNestTestApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    try {
      if (prisma) {
        // Thu thập tất cả đơn do các user của suite này sở hữu để cleanup triệt để
        if (registry.userIds?.length) {
          const ownedOrders = await prisma.order.findMany({
            where: {
              userId: { in: registry.userIds },
            },
            select: { id: true },
          });

          registry.orderIds = [
            ...new Set([
              ...(registry.orderIds ?? []),
              ...ownedOrders.map((order) => order.id),
            ]),
          ];
        }

        await cleanupTestData(prisma, registry);
      }
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  async function createTestUser() {
    const email = `${generateTestIdentifier('orders-user')}@example.test`;

    const user = await db().user.create({
      data: {
        email,
        passwordHash: 'integration-test-hash',
        fullName: 'Orders Integration Test',
      },
    });

    registry.userIds?.push(user.id);

    const token = jwt().sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async function createTestIngredient(stock: number) {
    const ingredient = await db().ingredient.create({
      data: {
        name: generateTestIdentifier('orders-ingredient'),
        unit: 'g',
        stock,
        minThreshold: 0,
        isAvailable: true,
      },
    });

    registry.ingredientIds?.push(ingredient.id);

    return ingredient;
  }

  async function createTestProduct(
    recipes: RecipeInput[],
    basePrice = 35_000,
  ) {
    const product = await db().product.create({
      data: {
        name: generateTestIdentifier('orders-product'),
        basePrice,
        stock: 0,
        version: 0,
        isAvailable: true,
        sizePrices: {
          create: [
            { size: ProductSize.S, priceAdjustment: 0 },
            { size: ProductSize.M, priceAdjustment: 5_000 },
            { size: ProductSize.L, priceAdjustment: 10_000 },
          ],
        },
      },
    });

    registry.productIds?.push(product.id);

    for (const recipe of recipes) {
      await db().productRecipe.create({
        data: {
          productId: product.id,
          ingredientId: recipe.ingredientId,
          size: recipe.size ?? ProductSize.M,
          quantity: recipe.quantity,
        },
      });
    }

    return product;
  }

  async function postOrder(token: string, payload: OrderPayload) {
    const response = await request(httpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    const createdOrderId = response.body?.data?.id;

    if (createdOrderId) {
      registry.orderIds?.push(createdOrderId);
    }

    return response;
  }

  // -----------------------------------------------------------
  // 1. POST /orders — DTO Validation & Route Protection (FR-13)
  // -----------------------------------------------------------
  describe('FR-13: Validation DTO & Bảo vệ Route khi tạo đơn', () => {
    it('[TC-ORDER-09] (AC-13.4): từ chối 400 Bad Request khi quantity không hợp lệ (0, âm, số thực)', async () => {
      const { user, token } = await createTestUser();

      const response = await postOrder(token, {
        items: [
          {
            productId: 'non-existent-product',
            size: ProductSize.M,
            quantity: 0,
          },
        ],
      });

      expect(response.status).toBe(400);

      const orderCount = await db().order.count({
        where: { userId: user.id },
      });
      expect(orderCount).toBe(0);
    });

    it('[TC-ORDER-08] (AC-13.3): từ chối 400 Bad Request khi danh sách items rỗng []', async () => {
      const { token } = await createTestUser();

      const response = await postOrder(token, {
        items: [],
      });

      expect(response.status).toBe(400);
    });

    it('[TC-ORDER-11] (AC-13.6): từ chối 401 Unauthorized khi không có JWT token', async () => {
      const response = await request(httpServer())
        .post('/api/v1/orders')
        .send({
          items: [
            {
              productId: 'any-product-id',
              size: ProductSize.M,
              quantity: 1,
            },
          ],
        });

      expect(response.status).toBe(401);
    });

    it('[TC-ORDER-19] (AC-13.14): từ chối 400 Bad Request khi client gửi thêm trường lạ ngoài DTO (forbidNonWhitelisted)', async () => {
      const { token } = await createTestUser();

      const response = await postOrder(token, {
        items: [
          {
            productId: 'prod-dummy',
            size: ProductSize.M,
            quantity: 1,
          },
        ],
        totalAmount: 1000, // Cố tình truyền trường ngoài DTO để hack giá
      });

      expect(response.status).toBe(400);
    });

    it('[TC-ORDER-15] (AC-13.10): từ chối 400 khi quantity = 100 và chấp nhận mốc biên quantity = 99', async () => {
      const { token } = await createTestUser();

      // Case 1: quantity = 100 (> Max 99) -> 400
      const res100 = await postOrder(token, {
        items: [
          {
            productId: 'prod-dummy',
            size: ProductSize.M,
            quantity: 100,
          },
        ],
      });
      expect(res100.status).toBe(400);

      // Case 2: quantity = 99 với đủ nguyên liệu -> 201 Created
      const ingredient = await createTestIngredient(2000);
      const product = await createTestProduct([
        {
          ingredientId: ingredient.id,
          quantity: 10,
        },
      ]);

      const res99 = await postOrder(token, {
        items: [
          {
            productId: product.id,
            size: ProductSize.M,
            quantity: 99,
          },
        ],
      });
      expect(res99.status).toBe(201);
      expect(res99.body.data.items[0].quantity).toBe(99);
    });

    it('[TC-ORDER-16] (AC-13.11): từ chối 400 Bad Request khi topping trùng lặp hoặc gửi quá 3 topping', async () => {
      const { token } = await createTestUser();

      // Topping trùng lặp
      const resDuplicate = await postOrder(token, {
        items: [
          {
            productId: 'prod-dummy',
            size: ProductSize.M,
            quantity: 1,
            toppingIds: ['top-1', 'top-1'],
          },
        ],
      });
      expect(resDuplicate.status).toBe(400);

      // Quá 3 topping (4 topping)
      const resExceed = await postOrder(token, {
        items: [
          {
            productId: 'prod-dummy',
            size: ProductSize.M,
            quantity: 1,
            toppingIds: ['top-1', 'top-2', 'top-3', 'top-4'],
          },
        ],
      });
      expect(resExceed.status).toBe(400);
    });

    it('[TC-ORDER-10] (AC-13.5): từ chối 400 Bad Request khi sản phẩm đã bị tắt bán (isAvailable = false)', async () => {
      const { token } = await createTestUser();

      const unavailableProduct = await db().product.create({
        data: {
          name: generateTestIdentifier('unavailable-prod'),
          basePrice: 35_000,
          stock: 0,
          version: 0,
          isAvailable: false,
          sizePrices: {
            create: [
              { size: ProductSize.S, priceAdjustment: 0 },
              { size: ProductSize.M, priceAdjustment: 5_000 },
            ],
          },
        },
      });
      registry.productIds?.push(unavailableProduct.id);

      const response = await postOrder(token, {
        items: [
          {
            productId: unavailableProduct.id,
            size: ProductSize.M,
            quantity: 1,
          },
        ],
      });

      expect(response.status).toBe(400);
    });

    it('[TC-ORDER-18] (AC-13.13): từ chối 404 NotFoundException khi người dùng trong JWT không tồn tại trong CSDL', async () => {
      const ghostToken = jwt().sign({
        sub: '00000000-0000-0000-0000-000000000000',
        email: 'ghost@brewlite.test',
        role: 'CUSTOMER',
      });

      const ingredient = await createTestIngredient(50);
      const product = await createTestProduct([
        {
          ingredientId: ingredient.id,
          quantity: 10,
        },
      ]);

      const response = await postOrder(ghostToken, {
        items: [
          {
            productId: product.id,
            size: ProductSize.M,
            quantity: 1,
          },
        ],
      });

      expect(response.status).toBe(404);
    });
  });

  // -----------------------------------------------------------
  // 2. POST /orders — Tồn kho nguyên liệu (FR-14)
  // -----------------------------------------------------------
  describe('FR-14: Trừ kho nguyên liệu & Chống âm kho', () => {
    it('[TC-ORDER-02] (AC-14.1): từ chối 400 Bad Request khi nguyên liệu trong kho không đủ', async () => {
      const { user, token } = await createTestUser();

      const ingredient = await createTestIngredient(5);

      const product = await createTestProduct([
        {
          ingredientId: ingredient.id,
          quantity: 10,
        },
      ]);

      const response = await postOrder(token, {
        items: [
          {
            productId: product.id,
            size: ProductSize.M,
            quantity: 1,
          },
        ],
      });

      expect(response.status).toBe(400);

      const updatedIngredient = await db().ingredient.findUniqueOrThrow({
        where: { id: ingredient.id },
      });

      expect(updatedIngredient.stock).toBe(5);

      const orderCount = await db().order.count({
        where: { userId: user.id },
      });
      expect(orderCount).toBe(0);
    });
  });

  // -----------------------------------------------------------
  // 3. POST /orders — Áp dụng Khuyến mãi (FR-15)
  // -----------------------------------------------------------
  describe('FR-15: Áp dụng mã khuyến mãi & Ràng buộc điều kiện', () => {
    it('[TC-ORDER-26] (AC-15.1, AC-15.2): áp dụng thành công mã giảm giá cố định hợp lệ (hỗ trợ case-insensitive)', async () => {
      const { user, token } = await createTestUser();

      const ingredient = await createTestIngredient(100);

      const product = await createTestProduct([
        {
          ingredientId: ingredient.id,
          quantity: 20,
        },
      ]);

      const promotionCode = generateTestIdentifier('promo').toUpperCase();

      const promotion = await db().promotion.create({
        data: {
          code: promotionCode,
          discountPercent: null,
          discountAmount: 5_000,
          minOrderAmount: 0,
          startDate: new Date(Date.now() - 60_000),
          endDate: new Date(Date.now() + 60 * 60 * 1_000),
          isActive: true,
        },
      });

      registry.promotionIds?.push(promotion.id);

      const response = await postOrder(token, {
        items: [
          {
            productId: product.id,
            size: ProductSize.M,
            quantity: 1,
          },
        ],
        promotionCode: promotionCode.toLowerCase(),
      });

      expect(response.status).toBe(201);

      const createdOrder = response.body.data;

      expect(createdOrder).toBeDefined();
      expect(Number(createdOrder.totalAmount)).toBe(40_000);
      expect(Number(createdOrder.discountAmount)).toBe(5_000);
      expect(Number(createdOrder.finalAmount)).toBe(35_000);

      const savedOrder = await db().order.findUniqueOrThrow({
        where: { id: createdOrder.id },
      });

      expect(savedOrder.userId).toBe(user.id);
      expect(savedOrder.promotionId).toBe(promotion.id);
      expect(Number(savedOrder.finalAmount)).toBe(35_000);
    });

    it('[TC-ORDER-27] (AC-15.8): từ chối 400 Bad Request khi mã khuyến mãi không tồn tại hoặc đã hết hạn', async () => {
      const { token } = await createTestUser();
      const ingredient = await createTestIngredient(50);
      const product = await createTestProduct([
        {
          ingredientId: ingredient.id,
          quantity: 10,
        },
      ]);

      // Case 1: Mã hoàn toàn không tồn tại
      const resNonExistent = await postOrder(token, {
        items: [
          {
            productId: product.id,
            size: ProductSize.M,
            quantity: 1,
          },
        ],
        promotionCode: 'MA_KHONG_TON_TAI_XYZ',
      });
      expect(resNonExistent.status).toBe(400);

      // Case 2: Mã đã hết hạn thời gian
      const expiredCode = generateTestIdentifier('expired_code').toUpperCase();
      const expiredPromo = await db().promotion.create({
        data: {
          code: expiredCode,
          discountAmount: 10_000,
          minOrderAmount: 0,
          startDate: new Date(Date.now() - 120_000),
          endDate: new Date(Date.now() - 60_000),
          isActive: true,
        },
      });
      registry.promotionIds?.push(expiredPromo.id);

      const resExpired = await postOrder(token, {
        items: [
          {
            productId: product.id,
            size: ProductSize.M,
            quantity: 1,
          },
        ],
        promotionCode: expiredCode,
      });
      expect(resExpired.status).toBe(400);
    });

    it('[TC-ORDER-28] (AC-15.6): từ chối 400 Bad Request khi giá trị đơn chưa đạt minOrderAmount của mã', async () => {
      const { token } = await createTestUser();
      const ingredient = await createTestIngredient(50);
      // product size M: base 35k + 5k = 40k
      const product = await createTestProduct([
        {
          ingredientId: ingredient.id,
          quantity: 10,
        },
      ]);

      const highMinCode = generateTestIdentifier('min_order_code').toUpperCase();
      const highMinPromo = await db().promotion.create({
        data: {
          code: highMinCode,
          discountAmount: 15_000,
          minOrderAmount: 60_000, // Đơn 40k < 60k
          startDate: new Date(Date.now() - 60_000),
          endDate: new Date(Date.now() + 60_000),
          isActive: true,
        },
      });
      registry.promotionIds?.push(highMinPromo.id);

      const response = await postOrder(token, {
        items: [
          {
            productId: product.id,
            size: ProductSize.M,
            quantity: 1,
          },
        ],
        promotionCode: highMinCode,
      });
      expect(response.status).toBe(400);
    });
  });

  // -----------------------------------------------------------
  // 4. POST /orders — Transaction Rollback (AC-13.2 / AC-14.1)
  // -----------------------------------------------------------
  describe('FR-13 & FR-14: Tính nguyên tử (Transaction Rollback)', () => {
    it('[TC-ORDER-07] (AC-13.2, AC-14.1): hoàn lại toàn bộ nguyên liệu đã trừ trước đó khi một nguyên liệu sau bị thiếu', async () => {
      const { user, token } = await createTestUser();

      const ingredientA = await createTestIngredient(100);
      const ingredientB = await createTestIngredient(100);

      // deductIngredients xử lý ingredientId theo thứ tự tăng dần.
      // Đặt kho của ID đứng trước đủ hàng, ID đứng sau thiếu hàng.
      const sortedIngredients = [ingredientA, ingredientB].sort((a, b) =>
        a.id.localeCompare(b.id),
      );

      const firstIngredient = sortedIngredients[0];
      const secondIngredient = sortedIngredients[1];

      await db().ingredient.update({
        where: { id: firstIngredient.id },
        data: { stock: 50 },
      });

      await db().ingredient.update({
        where: { id: secondIngredient.id },
        data: { stock: 1 },
      });

      const product = await createTestProduct([
        {
          ingredientId: firstIngredient.id,
          quantity: 10,
        },
        {
          ingredientId: secondIngredient.id,
          quantity: 10,
        },
      ]);

      const response = await postOrder(token, {
        items: [
          {
            productId: product.id,
            size: ProductSize.M,
            quantity: 1,
          },
        ],
      });

      expect(response.status).toBe(400);

      const firstAfter = await db().ingredient.findUniqueOrThrow({
        where: { id: firstIngredient.id },
      });

      const secondAfter = await db().ingredient.findUniqueOrThrow({
        where: { id: secondIngredient.id },
      });

      // Nguyên liệu đầu tiên đã bị trừ trong transaction,
      // nhưng phải được khôi phục khi nguyên liệu thứ hai thất bại.
      expect(firstAfter.stock).toBe(50);
      expect(secondAfter.stock).toBe(1);

      expect(
        await db().order.count({
          where: { userId: user.id },
        }),
      ).toBe(0);

      expect(
        await db().orderIngredientUsage.count({
          where: {
            order: { userId: user.id },
          },
        }),
      ).toBe(0);
    });
  });

  // -----------------------------------------------------------
  // 5. GET /orders/me — Lịch sử Đơn & Phân quyền (FR-21)
  // -----------------------------------------------------------
  describe('FR-21: Truy vấn Lịch sử đơn hàng cá nhân', () => {
    it('[TC-HIST-04] (AC-21.11): cô lập quyền sở hữu — User A không đọc được đơn của User B', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();

      // Tạo một đơn thuộc sở hữu User B trực tiếp trong database.
      const orderB = await db().order.create({
        data: {
          userId: userB.user.id,
          totalAmount: 25_000,
          finalAmount: 25_000,
        },
      });

      registry.orderIds?.push(orderB.id);

      const responseA = await request(httpServer())
        .get('/api/v1/orders/me')
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(200);

      const responseB = await request(httpServer())
        .get('/api/v1/orders/me')
        .set('Authorization', `Bearer ${userB.token}`)
        .expect(200);

      expect(responseA.body.data.pagination.total).toBe(0);
      expect(responseA.body.data.items).toEqual([]);

      expect(responseB.body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: orderB.id }),
        ]),
      );
    });

    it('[TC-HIST-01] (AC-21.9): từ chối 401 Unauthorized khi không truyền token JWT', async () => {
      const response = await request(httpServer()).get('/api/v1/orders/me');
      expect(response.status).toBe(401);
    });

    it('[TC-HIST-02] (AC-21.8): từ chối 400 Bad Request khi query param không hợp lệ (page=0, limit=51, status sai)', async () => {
      const { token } = await createTestUser();

      // page = 0 (< min 1)
      const resPage = await request(httpServer())
        .get('/api/v1/orders/me?page=0')
        .set('Authorization', `Bearer ${token}`);
      expect(resPage.status).toBe(400);

      // limit = 51 (> max 50)
      const resLimit = await request(httpServer())
        .get('/api/v1/orders/me?limit=51')
        .set('Authorization', `Bearer ${token}`);
      expect(resLimit.status).toBe(400);

      // status = 'SHIPPED' (không nằm trong enum OrderStatus)
      const resStatus = await request(httpServer())
        .get('/api/v1/orders/me?status=SHIPPED')
        .set('Authorization', `Bearer ${token}`);
      expect(resStatus.status).toBe(400);
    });

    it('[TC-HIST-03] (AC-21.1, AC-21.2): phân trang và sắp xếp giảm dần theo thời gian tạo (mới nhất lên đầu), lọc đúng status', async () => {
      const { user, token } = await createTestUser();

      // Tạo 3 đơn với thời gian và trạng thái khác nhau
      const orderOldest = await db().order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PENDING,
          totalAmount: 30_000,
          finalAmount: 30_000,
          createdAt: new Date('2026-11-01T10:00:00Z'),
        },
      });

      const orderMiddle = await db().order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PAID,
          totalAmount: 45_000,
          finalAmount: 45_000,
          createdAt: new Date('2026-11-02T10:00:00Z'),
        },
      });

      const orderNewest = await db().order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PENDING,
          totalAmount: 50_000,
          finalAmount: 50_000,
          createdAt: new Date('2026-11-03T10:00:00Z'),
        },
      });

      registry.orderIds?.push(orderOldest.id, orderMiddle.id, orderNewest.id);

      // Test phân trang: page=1, limit=2 -> trả về 2 đơn mới nhất: orderNewest rồi đến orderMiddle
      const resPage1 = await request(httpServer())
        .get('/api/v1/orders/me?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(resPage1.body.data.pagination.total).toBe(3);
      expect(resPage1.body.data.pagination.totalPages).toBe(2);
      expect(resPage1.body.data.pagination.hasNextPage).toBe(true);
      expect(resPage1.body.data.items).toHaveLength(2);
      expect(resPage1.body.data.items[0].id).toBe(orderNewest.id);
      expect(resPage1.body.data.items[1].id).toBe(orderMiddle.id);

      // Test lọc theo status = PAID -> chỉ có duy nhất orderMiddle
      const resFiltered = await request(httpServer())
        .get(`/api/v1/orders/me?status=${OrderStatus.PAID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(resFiltered.body.data.pagination.total).toBe(1);
      expect(resFiltered.body.data.items).toHaveLength(1);
      expect(resFiltered.body.data.items[0].id).toBe(orderMiddle.id);
      expect(resFiltered.body.data.items[0].status).toBe(OrderStatus.PAID);
    });
  });
});

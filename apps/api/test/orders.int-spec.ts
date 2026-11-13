import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProductSize } from '@prisma/client';
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
  items: Array<{
    productId: string;
    size?: ProductSize;
    quantity: number;
    toppingIds?: string[];
  }>;
  promotionCode?: string;
};

describe('Orders API Integration Tests', () => {
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
        // Thu thập tất cả đơn do các user của suite này sở hữu.
        // Điều này giúp cleanup kể cả khi một assertion thất bại giữa test.
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
  // 1. POST /orders — DTO validation
  // -----------------------------------------------------------
  it('rejects invalid quantity and does not create an order', async () => {
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

  // -----------------------------------------------------------
  // 2. POST /orders — Insufficient ingredient stock
  // -----------------------------------------------------------
  it('rejects an order when ingredient stock is insufficient', async () => {
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

  // -----------------------------------------------------------
  // 3. POST /orders — Promotion
  // -----------------------------------------------------------
  it('applies a valid fixed-amount promotion correctly', async () => {
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

  // -----------------------------------------------------------
  // 4. POST /orders — Transaction rollback
  // -----------------------------------------------------------
  it('rolls back earlier ingredient deductions when a later ingredient is insufficient', async () => {
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

  // -----------------------------------------------------------
  // 5. GET /orders/me — Ownership isolation
  // -----------------------------------------------------------
  it('does not expose User B orders to User A', async () => {
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
});
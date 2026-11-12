import { BadRequestException } from '@nestjs/common';
import { ProductSize } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingItemInput, PricingService } from './pricing.service';
import {
  cleanupTestData,
  generateTestIdentifier,
  TestDataRegistry,
} from '../../../test/test-helper';

describe('PricingService Integration (PostgreSQL + Prisma)', () => {
  let prisma: PrismaService;
  let pricingService: PricingService;

  const registry: TestDataRegistry = {
    productIds: [],
  };
  const createdToppingIds: string[] = [];

  let activeProductId: string;
  let unavailableProductId: string;
  let toppingPearlId: string;
  let toppingCheeseId: string;
  let unavailableToppingId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    pricingService = new PricingService(prisma);

    const activeProduct = await prisma.product.create({
      data: {
        name: generateTestIdentifier('pricing_prod_active'),
        basePrice: 36000,
        isAvailable: true,
        sizePrices: {
          create: [
            { size: ProductSize.S, priceAdjustment: 0 },
            { size: ProductSize.M, priceAdjustment: 5000 },
            { size: ProductSize.L, priceAdjustment: 10000 },
          ],
        },
      },
    });
    activeProductId = activeProduct.id;
    registry.productIds?.push(activeProduct.id);

    const unavailableProduct = await prisma.product.create({
      data: {
        name: generateTestIdentifier('pricing_prod_inactive'),
        basePrice: 30000,
        isAvailable: false,
        sizePrices: {
          create: [{ size: ProductSize.S, priceAdjustment: 0 }],
        },
      },
    });
    unavailableProductId = unavailableProduct.id;
    registry.productIds?.push(unavailableProduct.id);

    const pearl = await prisma.topping.create({
      data: {
        name: generateTestIdentifier('pricing_top_pearl'),
        price: 5000,
        isAvailable: true,
      },
    });
    toppingPearlId = pearl.id;
    createdToppingIds.push(pearl.id);

    const cheese = await prisma.topping.create({
      data: {
        name: generateTestIdentifier('pricing_top_cheese'),
        price: 10000,
        isAvailable: true,
      },
    });
    toppingCheeseId = cheese.id;
    createdToppingIds.push(cheese.id);

    const inactiveTop = await prisma.topping.create({
      data: {
        name: generateTestIdentifier('pricing_top_inactive'),
        price: 8000,
        isAvailable: false,
      },
    });
    unavailableToppingId = inactiveTop.id;
    createdToppingIds.push(inactiveTop.id);
  });

  afterAll(async () => {
    if (createdToppingIds.length) {
      await prisma.topping.deleteMany({
        where: { id: { in: createdToppingIds } },
      });
    }
    await cleanupTestData(prisma, registry);
    await prisma.$disconnect();
  });

  it('tính đúng giá sản phẩm, phụ thu size và nhiều topping từ PostgreSQL thật (AC-08.1, AC-09.2)', async () => {
    const result = await pricingService.calculate([
      {
        productId: activeProductId,
        size: ProductSize.L,
        toppingIds: [toppingPearlId, toppingCheeseId],
        quantity: 2,
      },
      {
        productId: activeProductId,
        size: ProductSize.S,
        toppingIds: [],
        quantity: 1,
      },
    ]);

    // Line 1: (36000 + 10000 + 5000 + 10000) * 2 = 61000 * 2 = 122000
    // Line 2: (36000 + 0 + 0) * 1 = 36000
    // Subtotal: 158000
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toMatchObject({
      productId: activeProductId,
      size: ProductSize.L,
      quantity: 2,
      unitPrice: 46000,
      toppingTotal: 15000,
      unitPriceWithToppings: 61000,
      lineTotal: 122000,
    });
    expect(result.lines[1]).toMatchObject({
      productId: activeProductId,
      size: ProductSize.S,
      quantity: 1,
      unitPrice: 36000,
      toppingTotal: 0,
      unitPriceWithToppings: 36000,
      lineTotal: 36000,
    });
    expect(result.subtotal).toBe(158000);
  });

  it('bỏ qua giá giả mạo từ client và luôn tính lại từ bản ghi PostgreSQL (AC-09.2 / TC-DETAIL-05)', async () => {
    const tampered = [
      {
        productId: activeProductId,
        size: ProductSize.M,
        toppingIds: [toppingPearlId],
        quantity: 3,
        unitPrice: 1,
        lineTotal: 3,
        subtotal: 3,
      },
    ] as unknown as PricingItemInput[];

    const result = await pricingService.calculate(tampered);

    // (36000 + 5000 + 5000) * 3 = 138000
    expect(result.lines[0].unitPrice).toBe(41000);
    expect(result.lines[0].toppingTotal).toBe(5000);
    expect(result.lines[0].lineTotal).toBe(138000);
    expect(result.subtotal).toBe(138000);
  });

  it('từ chối sản phẩm/topping ngừng bán hoặc không tồn tại trong DB', async () => {
    await expect(
      pricingService.calculate([
        {
          productId: unavailableProductId,
          size: ProductSize.S,
          quantity: 1,
        },
      ]),
    ).rejects.toThrow(BadRequestException);

    await expect(
      pricingService.calculate([
        {
          productId: activeProductId,
          size: ProductSize.S,
          toppingIds: [unavailableToppingId],
          quantity: 1,
        },
      ]),
    ).rejects.toThrow(BadRequestException);

    await expect(
      pricingService.calculate([
        {
          productId: generateTestIdentifier('nonexistent'),
          size: ProductSize.S,
          quantity: 1,
        },
      ]),
    ).rejects.toThrow(BadRequestException);
  });
});


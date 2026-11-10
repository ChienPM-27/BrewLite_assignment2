import { BadRequestException } from '@nestjs/common';
import { Prisma, ProductSize } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAX_QUANTITY,
  MAX_TOPPINGS_PER_ITEM,
  MIN_QUANTITY,
  PricingItemInput,
  PricingService,
} from './pricing.service';

interface MockSizePrice {
  size: ProductSize;
  priceAdjustment: Prisma.Decimal;
}

interface MockProduct {
  id: string;
  name: string;
  basePrice: Prisma.Decimal;
  isAvailable: boolean;
  sizePrices: MockSizePrice[];
}

interface MockTopping {
  id: string;
  name: string;
  price: Prisma.Decimal;
  isAvailable: boolean;
}

const TEST_PREFIX = 'unit-pricing-';

function buildProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: `${TEST_PREFIX}prod-coffee`,
    name: 'Cà phê sữa đá test',
    basePrice: new Prisma.Decimal(35000),
    isAvailable: true,
    sizePrices: [
      { size: ProductSize.S, priceAdjustment: new Prisma.Decimal(0) },
      { size: ProductSize.M, priceAdjustment: new Prisma.Decimal(5000) },
      { size: ProductSize.L, priceAdjustment: new Prisma.Decimal(10000) },
    ],
    ...overrides,
  };
}

function buildTopping(overrides: Partial<MockTopping> = {}): MockTopping {
  return {
    id: `${TEST_PREFIX}top-1`,
    name: 'Trân châu trắng test',
    price: new Prisma.Decimal(5000),
    isAvailable: true,
    ...overrides,
  };
}

describe('PricingService (FR-08, FR-09)', () => {
  let service: PricingService;

  const prismaMock = {
    product: {
      findMany: jest.fn(),
    },
    topping: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PricingService(prismaMock as unknown as PrismaService);
  });

  describe('Tính giá cơ bản & phụ thu size (AC-08.1 / TC-DETAIL-03)', () => {
    it('tính đúng giá cơ bản (basePrice) khi chọn size S và không có topping', async () => {
      const product = buildProduct();
      prismaMock.product.findMany.mockResolvedValue([product]);

      const result = await service.calculate([
        {
          productId: product.id,
          size: ProductSize.S,
          quantity: 1,
        },
      ]);

      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: [product.id] } },
        include: { sizePrices: true },
      });
      expect(prismaMock.topping.findMany).not.toHaveBeenCalled();

      expect(result).toEqual({
        lines: [
          {
            productId: product.id,
            size: ProductSize.S,
            quantity: 1,
            unitPrice: 35000,
            toppingTotal: 0,
            unitPriceWithToppings: 35000,
            lineTotal: 35000,
            toppings: [],
          },
        ],
        subtotal: 35000,
      });
    });

    it.each([
      { size: ProductSize.S, expectedUnitPrice: 35000 },
      { size: ProductSize.M, expectedUnitPrice: 40000 },
      { size: ProductSize.L, expectedUnitPrice: 45000 },
    ])(
      'cộng đúng phụ thu theo từng option size $size',
      async ({ size, expectedUnitPrice }) => {
        const product = buildProduct();
        prismaMock.product.findMany.mockResolvedValue([product]);

        const result = await service.calculate([
          {
            productId: product.id,
            size,
            toppingIds: [],
            quantity: 1,
          },
        ]);

        expect(result.lines[0].size).toBe(size);
        expect(result.lines[0].unitPrice).toBe(expectedUnitPrice);
        expect(result.lines[0].unitPriceWithToppings).toBe(expectedUnitPrice);
        expect(result.lines[0].lineTotal).toBe(expectedUnitPrice);
        expect(result.subtotal).toBe(expectedUnitPrice);
      },
    );

    it('sử dụng size mặc định M theo contract service khi không truyền size', async () => {
      const product = buildProduct();
      prismaMock.product.findMany.mockResolvedValue([product]);

      const result = await service.calculate([
        {
          productId: product.id,
          quantity: 1,
        },
      ]);

      expect(result.lines[0].size).toBe(ProductSize.M);
      expect(result.lines[0].unitPrice).toBe(40000);
      expect(result.subtotal).toBe(40000);
    });
  });

  describe('Tính phụ thu topping & độ chính xác tổng tiền (AC-08.2, AC-09.2)', () => {
    it('xử lý đúng trường hợp không chọn topping (toppingIds rỗng)', async () => {
      const product = buildProduct();
      prismaMock.product.findMany.mockResolvedValue([product]);

      const result = await service.calculate([
        {
          productId: product.id,
          size: ProductSize.M,
          toppingIds: [],
          quantity: 2,
        },
      ]);

      expect(prismaMock.topping.findMany).not.toHaveBeenCalled();
      expect(result.lines[0].toppingTotal).toBe(0);
      expect(result.lines[0].toppings).toEqual([]);
      expect(result.lines[0].unitPriceWithToppings).toBe(40000);
      expect(result.lines[0].lineTotal).toBe(80000);
      expect(result.subtotal).toBe(80000);
    });

    it('cộng đúng phụ thu khi chọn 1 topping', async () => {
      const product = buildProduct();
      const topping1 = buildTopping({
        id: `${TEST_PREFIX}top-pearl`,
        name: 'Trân châu trắng',
        price: new Prisma.Decimal(5000),
      });
      prismaMock.product.findMany.mockResolvedValue([product]);
      prismaMock.topping.findMany.mockResolvedValue([topping1]);

      const result = await service.calculate([
        {
          productId: product.id,
          size: ProductSize.S,
          toppingIds: [topping1.id],
          quantity: 1,
        },
      ]);

      expect(result.lines[0]).toEqual({
        productId: product.id,
        size: ProductSize.S,
        quantity: 1,
        unitPrice: 35000,
        toppingTotal: 5000,
        unitPriceWithToppings: 40000,
        lineTotal: 40000,
        toppings: [{ toppingId: topping1.id, price: 5000 }],
      });
      expect(result.subtotal).toBe(40000);
    });

    it('cộng đúng phụ thu khi chọn nhiều topping (tối đa 3 topping)', async () => {
      const product = buildProduct({
        basePrice: new Prisma.Decimal(40000),
      });
      const t1 = buildTopping({
        id: `${TEST_PREFIX}top-1`,
        price: new Prisma.Decimal(5000),
      });
      const t2 = buildTopping({
        id: `${TEST_PREFIX}top-2`,
        price: new Prisma.Decimal(10000),
      });
      const t3 = buildTopping({
        id: `${TEST_PREFIX}top-3`,
        price: new Prisma.Decimal(8000),
      });
      prismaMock.product.findMany.mockResolvedValue([product]);
      prismaMock.topping.findMany.mockResolvedValue([t1, t2, t3]);

      const result = await service.calculate([
        {
          productId: product.id,
          size: ProductSize.L,
          toppingIds: [t1.id, t2.id, t3.id],
          quantity: 3,
        },
      ]);

      // unitPrice = 40000 + 10000 = 50000
      // toppingTotal = 5000 + 10000 + 8000 = 23000
      // unitPriceWithToppings = 73000
      // lineTotal = 73000 * 3 = 219000
      expect(result.lines[0]).toEqual({
        productId: product.id,
        size: ProductSize.L,
        quantity: 3,
        unitPrice: 50000,
        toppingTotal: 23000,
        unitPriceWithToppings: 73000,
        lineTotal: 219000,
        toppings: [
          { toppingId: t1.id, price: 5000 },
          { toppingId: t2.id, price: 10000 },
          { toppingId: t3.id, price: 8000 },
        ],
      });
      expect(result.subtotal).toBe(219000);
    });

    it('tính chính xác tổng tiền nhiều dòng, không làm tròn sai số với số lượng lớn', async () => {
      const prodA = buildProduct({
        id: `${TEST_PREFIX}prod-a`,
        basePrice: new Prisma.Decimal(33500),
        sizePrices: [
          { size: ProductSize.S, priceAdjustment: new Prisma.Decimal(0) },
          { size: ProductSize.M, priceAdjustment: new Prisma.Decimal(4500) },
          { size: ProductSize.L, priceAdjustment: new Prisma.Decimal(9500) },
        ],
      });
      const prodB = buildProduct({
        id: `${TEST_PREFIX}prod-b`,
        basePrice: new Prisma.Decimal(29000),
        sizePrices: [
          { size: ProductSize.S, priceAdjustment: new Prisma.Decimal(0) },
          { size: ProductSize.M, priceAdjustment: new Prisma.Decimal(5000) },
        ],
      });
      const top = buildTopping({
        id: `${TEST_PREFIX}top-shared`,
        price: new Prisma.Decimal(7500),
      });

      prismaMock.product.findMany.mockResolvedValue([prodA, prodB]);
      prismaMock.topping.findMany.mockResolvedValue([top]);

      const result = await service.calculate([
        {
          productId: prodA.id,
          size: ProductSize.L,
          toppingIds: [top.id],
          quantity: MAX_QUANTITY,
        },
        {
          productId: prodA.id,
          size: ProductSize.S,
          toppingIds: [],
          quantity: 2,
        },
        {
          productId: prodB.id,
          size: ProductSize.M,
          toppingIds: [top.id],
          quantity: 1,
        },
      ]);

      // Đảm bảo deduplicate ID khi query DB
      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: [prodA.id, prodB.id] } },
        include: { sizePrices: true },
      });
      expect(prismaMock.topping.findMany).toHaveBeenCalledWith({
        where: { id: { in: [top.id] } },
      });

      // Line 1: (33500 + 9500 + 7500) * 99 = 50500 * 99 = 4999500
      // Line 2: (33500 + 0 + 0) * 2 = 67000
      // Line 3: (29000 + 5000 + 7500) * 1 = 41500
      // Subtotal: 4999500 + 67000 + 41500 = 5108000
      expect(result.lines[0].lineTotal).toBe(4999500);
      expect(result.lines[1].lineTotal).toBe(67000);
      expect(result.lines[2].lineTotal).toBe(41500);
      expect(result.subtotal).toBe(5108000);
      expect(Number.isInteger(result.subtotal)).toBe(true);
    });

    it('bảo vệ tính toàn vẹn giá: bỏ qua mọi giá giả mạo gửi từ client (AC-09.2 / TC-DETAIL-05)', async () => {
      const product = buildProduct({
        basePrice: new Prisma.Decimal(45000),
      });
      const topping = buildTopping({
        id: `${TEST_PREFIX}top-cheese`,
        price: new Prisma.Decimal(10000),
      });
      prismaMock.product.findMany.mockResolvedValue([product]);
      prismaMock.topping.findMany.mockResolvedValue([topping]);

      const tamperedPayload = [
        {
          productId: product.id,
          size: ProductSize.L,
          toppingIds: [topping.id],
          quantity: 2,
          // Client cố tình chèn giá giả mạo vào payload
          basePrice: 1,
          unitPrice: 1,
          unitPriceWithToppings: 1,
          lineTotal: 2,
          subtotal: 2,
          price: 0,
        },
      ] as unknown as PricingItemInput[];

      const result = await service.calculate(tamperedPayload);

      // (45000 + 10000 + 10000) * 2 = 130000 (không bị ảnh hưởng bởi giá giả mạo)
      expect(result.lines[0].unitPrice).toBe(55000);
      expect(result.lines[0].toppingTotal).toBe(10000);
      expect(result.lines[0].unitPriceWithToppings).toBe(65000);
      expect(result.lines[0].lineTotal).toBe(130000);
      expect(result.subtotal).toBe(130000);
    });
  });

  describe('Edge cases & Validate đầu vào', () => {
    it('từ chối danh sách items rỗng hoặc không phải mảng', async () => {
      await expect(service.calculate([])).rejects.toThrow(BadRequestException);
      await expect(
        service.calculate(null as unknown as PricingItemInput[]),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.product.findMany).not.toHaveBeenCalled();
    });

    it('từ chối productId rỗng hoặc sai kiểu', async () => {
      await expect(
        service.calculate([{ productId: '', quantity: 1 }]),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.calculate([
          { productId: undefined as unknown as string, quantity: 1 },
        ]),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.product.findMany).not.toHaveBeenCalled();
    });

    it.each([
      { label: 'số âm', quantity: -1 },
      { label: 'bằng 0', quantity: 0 },
      { label: 'số thập phân', quantity: 1.5 },
      { label: 'NaN', quantity: Number.NaN },
      { label: `vượt quá ${MAX_QUANTITY}`, quantity: MAX_QUANTITY + 1 },
    ])(
      `từ chối số lượng không hợp lệ ($label; giới hạn ${MIN_QUANTITY}..${MAX_QUANTITY})`,
      async ({ quantity }) => {
        await expect(
          service.calculate([
            {
              productId: `${TEST_PREFIX}prod-1`,
              size: ProductSize.S,
              quantity,
            },
          ]),
        ).rejects.toThrow(BadRequestException);
        expect(prismaMock.product.findMany).not.toHaveBeenCalled();
      },
    );

    it('từ chối size không thuộc {S, M, L}', async () => {
      await expect(
        service.calculate([
          {
            productId: `${TEST_PREFIX}prod-1`,
            size: 'XL',
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.calculate([
          {
            productId: `${TEST_PREFIX}prod-1`,
            size: '',
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.product.findMany).not.toHaveBeenCalled();
    });

    it('từ chối toppingIds không hợp lệ (chứa giá trị rỗng, vượt quá 3, hoặc trùng lặp)', async () => {
      const productId = `${TEST_PREFIX}prod-1`;

      // Không phải mảng
      await expect(
        service.calculate([
          {
            productId,
            size: ProductSize.S,
            toppingIds: 'top-1' as unknown as string[],
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(BadRequestException);

      // Chứa ID rỗng
      await expect(
        service.calculate([
          {
            productId,
            size: ProductSize.S,
            toppingIds: [''],
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(BadRequestException);

      // Vượt quá 3 topping
      await expect(
        service.calculate([
          {
            productId,
            size: ProductSize.S,
            toppingIds: Array.from(
              { length: MAX_TOPPINGS_PER_ITEM + 1 },
              (_, idx) => `${TEST_PREFIX}top-${idx + 1}`,
            ),
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(
        `Tối đa ${MAX_TOPPINGS_PER_ITEM} topping cho mỗi món`,
      );

      // Topping trùng lặp
      await expect(
        service.calculate([
          {
            productId,
            size: ProductSize.S,
            toppingIds: [`${TEST_PREFIX}top-dup`, `${TEST_PREFIX}top-dup`],
            quantity: 1,
          },
        ]),
      ).rejects.toThrow('Topping không được trùng lặp');

      expect(prismaMock.product.findMany).not.toHaveBeenCalled();
    });

    it('ném BadRequestException khi sản phẩm không tồn tại trong DB', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);

      await expect(
        service.calculate([
          {
            productId: `${TEST_PREFIX}missing-prod`,
            size: ProductSize.S,
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi sản phẩm đã ngừng bán (isAvailable = false)', async () => {
      const unavailableProduct = buildProduct({ isAvailable: false });
      prismaMock.product.findMany.mockResolvedValue([unavailableProduct]);

      await expect(
        service.calculate([
          {
            productId: unavailableProduct.id,
            size: ProductSize.S,
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi sản phẩm không có cấu hình size được yêu cầu', async () => {
      const sOnlyProduct = buildProduct({
        sizePrices: [
          { size: ProductSize.S, priceAdjustment: new Prisma.Decimal(0) },
        ],
      });
      prismaMock.product.findMany.mockResolvedValue([sOnlyProduct]);

      await expect(
        service.calculate([
          {
            productId: sOnlyProduct.id,
            size: ProductSize.L,
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi topping không tồn tại hoặc đã ngừng bán', async () => {
      const product = buildProduct();
      prismaMock.product.findMany.mockResolvedValue([product]);
      prismaMock.topping.findMany.mockResolvedValue([]);

      await expect(
        service.calculate([
          {
            productId: product.id,
            size: ProductSize.S,
            toppingIds: [`${TEST_PREFIX}missing-top`],
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(BadRequestException);

      const inactiveTopping = buildTopping({
        id: `${TEST_PREFIX}inactive-top`,
        isAvailable: false,
      });
      prismaMock.topping.findMany.mockResolvedValue([inactiveTopping]);

      await expect(
        service.calculate([
          {
            productId: product.id,
            size: ProductSize.S,
            toppingIds: [inactiveTopping.id],
            quantity: 1,
          },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});


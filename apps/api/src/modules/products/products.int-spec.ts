import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { PrismaService } from '../../prisma/prisma.service';
import {
  cleanupTestData,
  createNestTestApp,
  generateTestIdentifier,
  TestDataRegistry,
} from '../../../test/test-helper';

describe('Products integration tests (FR-05)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const registry: TestDataRegistry = { productIds: [] };

  beforeAll(async () => {
    app = await createNestTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanupTestData(prisma, registry);
    registry.productIds = [];
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await cleanupTestData(prisma, registry);
      }
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  async function createProduct(overrides: { isAvailable?: boolean; stock?: number } = {}) {
    const product = await prisma.product.create({
      data: {
        name: generateTestIdentifier('menu_product'),
        basePrice: 35000,
        imageUrl: 'https://example.test/menu-product.jpg',
        isAvailable: overrides.isAvailable ?? true,
        stock: overrides.stock ?? 10,
        sizePrices: { create: [{ size: 'M', priceAdjustment: 0 }] },
      },
    });
    registry.productIds!.push(product.id);
    return product;
  }

  it('TC-MENU-02: GET /products trả về danh sách sản phẩm hợp lệ', async () => {
    const visibleProduct = await createProduct();

    const response = await request(app.getHttpServer()).get('/api/v1/products').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: visibleProduct.id,
          name: visibleProduct.name,
          basePrice: 35000,
          imageUrl: visibleProduct.imageUrl,
          isAvailable: true,
          sizePrices: [{ size: 'M', priceAdjustment: 0 }],
        }),
      ]),
    );
  
  });

  it('TC-MENU-10: GET /products loại sản phẩm ngừng bán hoặc hết hàng', async () => {
    const visibleProduct = await createProduct();
    const unavailableProduct = await createProduct({
      isAvailable: false,
    });
    const outOfStockProduct = await createProduct({
      stock: 0,
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .expect(200);

    expect(response.body.success).toBe(true);

    const returnedProductIds = response.body.data.map(
      (product: { id: string }) => product.id,
    );

    expect(returnedProductIds).toContain(visibleProduct.id);
    expect(returnedProductIds).not.toContain(unavailableProduct.id);
    expect(returnedProductIds).not.toContain(outOfStockProduct.id);
  });

  it('TC-DETAIL-01: GET /products/:id trả về đúng chi tiết sản phẩm', async () => {
    const product = await createProduct();
    const response = await request(app.getHttpServer())
      .get(`/api/v1/products/${product.id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: product.id,
      name: product.name,
      basePrice: 35000,
      imageUrl: product.imageUrl,
      currency: 'VND',
      isAvailable: true,
      sizePrices: [{ size: 'M', priceAdjustment: 0 }],
    });
  });

  it('TC-DETAIL-02: GET /products/:id trả 404 cho ID không tồn tại', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/products/${generateTestIdentifier('missing')}`)
      .expect(404);
  });

  it('SP2-03: GET /products trả về [] khi không có sản phẩm hợp lệ', async () => {
  // 1. Tự tạo sản phẩm không đủ điều kiện hiển thị
  await createProduct({ isAvailable: false });
  await createProduct({ stock: 0 });

  // 2. Gọi API lấy danh sách sản phẩm
  const response = await request(app.getHttpServer())
    .get('/api/v1/products')
    .expect(200);

  // 3. Kiểm tra kết quả trả về
  expect(response.body.success).toBe(true);
  expect(response.body.data).toEqual([]);
  });
});

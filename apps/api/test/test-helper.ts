import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/**
 * Helper sinh mã ID duy nhất cho test để tránh xung đột dữ liệu
 */
export function generateTestIdentifier(prefix: string): string {
  const shortUuid = randomUUID().substring(0, 8);
  return `test_${prefix}_${shortUuid}_${Date.now()}`;
}

export interface TestDataRegistry {
  userIds?: string[];
  productIds?: string[];
  orderIds?: string[];
  paymentIds?: string[];
  promotionIds?: string[];
  ingredientIds?: string[];
}

/**
 * Helper khởi tạo Nest Application hoàn chỉnh cho integration / e2e testing qua supertest
 */
export async function createNestTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  return app;
}

/**
 * Helper dọn dẹp dữ liệu test an toàn:
 * Chỉ xóa các bản ghi nằm trong registry do chính test suite tạo ra.
 * Tuyệt đối không nuốt lỗi để đảm bảo phát hiện ngay sự cố dữ liệu.
 */
export async function cleanupTestData(
  prisma: PrismaClient,
  registry: TestDataRegistry,
): Promise<void> {
  if (registry.paymentIds?.length) {
    await prisma.payment.deleteMany({
      where: { id: { in: registry.paymentIds } },
    });
  }

  if (registry.orderIds?.length) {
    await prisma.orderIngredientUsage.deleteMany({
      where: { orderId: { in: registry.orderIds } },
    });
    await prisma.orderItemTopping.deleteMany({
      where: { orderItem: { orderId: { in: registry.orderIds } } },
    });
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: registry.orderIds } },
    });
    await prisma.orderStatusHistory.deleteMany({
      where: { orderId: { in: registry.orderIds } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: registry.orderIds } },
    });
  }

  if (registry.userIds?.length) {
    await prisma.loyaltyTransaction.deleteMany({
      where: { userId: { in: registry.userIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: registry.userIds } },
    });
  }

  if (registry.productIds?.length) {
    await prisma.productRecipe.deleteMany({
      where: { productId: { in: registry.productIds } },
    });
    await prisma.product.deleteMany({
      where: { id: { in: registry.productIds } },
    });
  }

  if (registry.promotionIds?.length) {
    await prisma.promotion.deleteMany({
      where: { id: { in: registry.promotionIds } },
    });
  }

  if (registry.ingredientIds?.length) {
    await prisma.ingredient.deleteMany({
      where: { id: { in: registry.ingredientIds } },
    });
  }
}

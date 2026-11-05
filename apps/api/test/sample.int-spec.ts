import { PrismaClient } from '@prisma/client';
import { generateTestIdentifier, cleanupTestData, TestDataRegistry } from './test-helper';

describe('Sample Database Integration Test (Quy tắc dữ liệu test)', () => {
  let prisma: PrismaClient;
  const registry: TestDataRegistry = {
    ingredientIds: [],
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    // Dọn dẹp chính xác những gì suite này tạo ra mà không nuốt lỗi
    await cleanupTestData(prisma, registry);
    await prisma.$disconnect();
  });

  it('tạo và truy vấn trực tiếp bản ghi trong Database bằng UUID, sau đó dọn dẹp sạch', async () => {
    const uniqueName = generateTestIdentifier('ingredient');

    // 1. Tạo bản ghi thực tế trong cơ sở dữ liệu
    const created = await prisma.ingredient.create({
      data: {
        name: uniqueName,
        unit: 'g',
        stock: 500,
        minThreshold: 50,
        isAvailable: true,
      },
    });

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.name).toBe(uniqueName);

    // Ghi nhận ID vào registry để afterAll dọn dẹp
    registry.ingredientIds?.push(created.id);

    // 2. Truy vấn trực tiếp từ DB để kiểm chứng
    const queried = await prisma.ingredient.findUnique({
      where: { id: created.id },
    });

    expect(queried).not.toBeNull();
    expect(queried?.name).toBe(uniqueName);
    expect(queried?.stock).toBe(500);
  });
});

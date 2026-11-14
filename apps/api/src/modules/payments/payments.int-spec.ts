import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OrderStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  Role,
} from '@prisma/client';
import * as request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import {
  cleanupTestData,
  createNestTestApp,
  generateTestIdentifier,
  TestDataRegistry,
} from '../../../test/test-helper';

describe('Payments Module Integration Tests (SP2-07 / Task 5.2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const registry: TestDataRegistry = {
    userIds: [],
    orderIds: [],
    paymentIds: [],
  };

  beforeAll(async () => {
    app = await createNestTestApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    if (prisma) {
      await cleanupTestData(prisma, registry);
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  async function createTestCustomer() {
    const uniqueEmail = `${generateTestIdentifier('cust')}@brewlite.test`;
    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        passwordHash: 'dummy_hash',
        fullName: 'Payment Integration Tester',
        role: Role.CUSTOMER,
        loyaltyPoints: 0,
      },
    });
    registry.userIds?.push(user.id);

    const token = await jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async function createTestOrder(
    userId: string,
    amount = 65000,
    status = OrderStatus.PENDING,
  ) {
    const order = await prisma.order.create({
      data: {
        userId,
        status,
        totalAmount: amount,
        discountAmount: 0,
        finalAmount: amount,
      },
    });
    registry.orderIds?.push(order.id);
    return order;
  }

  describe('TC-PAY-01: POST /api/v1/payments (Mock Gateway - Thành công)', () => {
    it('thanh toán Mock thành công: tạo bản ghi Payment SUCCESS, cập nhật Order PAID và cộng điểm tích lũy', async () => {
      const { user, token } = await createTestCustomer();
      const order = await createTestOrder(user.id, 80000, OrderStatus.PENDING);
      const idempotencyKey = generateTestIdentifier('idemp_succ');

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('idempotency-key', idempotencyKey)
        .set('x-mock-outcome', 'SUCCESS')
        .send({
          orderId: order.id,
          method: PaymentMethod.E_WALLET,
          gateway: PaymentGateway.MOCK,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.orderId).toBe(order.id);
      expect(res.body.data.status).toBe(PaymentStatus.SUCCESS);
      expect(Number(res.body.data.amount)).toBe(80000);
      expect(res.body.data.transactionRef).toMatch(/^MOCK-/);

      registry.paymentIds?.push(res.body.data.id);

      // 1. Kiểm tra trực tiếp trạng thái Order trong Database -> chuyển sang PAID
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(updatedOrder?.status).toBe(OrderStatus.PAID);

      // 2. Kiểm tra điểm loyalty được tích lũy cho người dùng (1000 VND = 1 điểm)
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.loyaltyPoints).toBeGreaterThan(0);
    });
  });

  describe('TC-PAY-02: POST /api/v1/payments (Mock Gateway - Thất bại & Retry)', () => {
    it('thanh toán thất bại: tạo Payment FAILED, cập nhật Order PAYMENT_FAILED, không trừ tiền và cho phép thử lại', async () => {
      const { user, token } = await createTestCustomer();
      const order = await createTestOrder(user.id, 50000, OrderStatus.PENDING);
      const idempotencyKeyFail = generateTestIdentifier('idemp_fail');

      // 1. Thực hiện thanh toán thất bại (x-mock-outcome: FAILED)
      const failRes = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('idempotency-key', idempotencyKeyFail)
        .set('x-mock-outcome', 'FAILED')
        .send({
          orderId: order.id,
          method: PaymentMethod.BANK_CARD,
          gateway: PaymentGateway.MOCK,
        })
        .expect(201);

      expect(failRes.body.success).toBe(true);
      expect(failRes.body.data.status).toBe(PaymentStatus.FAILED);
      expect(failRes.body.data.failureReason).toContain('Mô phỏng thanh toán thất bại');

      registry.paymentIds?.push(failRes.body.data.id);

      // Kiểm tra Order chuyển trạng thái PAYMENT_FAILED (giỏ hàng / đơn hàng giữ nguyên không bị hủy)
      const failedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(failedOrder?.status).toBe(OrderStatus.PAYMENT_FAILED);

      // 2. Thử lại thanh toán (Retry) với idempotency-key mới -> Thành công
      const idempotencyKeyRetry = generateTestIdentifier('idemp_retry');
      const retryRes = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('idempotency-key', idempotencyKeyRetry)
        .set('x-mock-outcome', 'SUCCESS')
        .send({
          orderId: order.id,
          method: PaymentMethod.BANK_CARD,
          gateway: PaymentGateway.MOCK,
        })
        .expect(201);

      expect(retryRes.body.data.status).toBe(PaymentStatus.SUCCESS);
      registry.paymentIds?.push(retryRes.body.data.id);

      const recoveredOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(recoveredOrder?.status).toBe(OrderStatus.PAID);
    });
  });

  describe('TC-PAY-03: Idempotency Key (Chống trùng lặp giao dịch)', () => {
    it('gửi lại request cùng idempotency-key và cùng payload sẽ trả về kết quả cũ, không tạo bản ghi mới', async () => {
      const { user, token } = await createTestCustomer();
      const order = await createTestOrder(user.id, 90000, OrderStatus.PENDING);
      const idempotencyKey = generateTestIdentifier('idemp_replay');

      // Request lần 1
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('idempotency-key', idempotencyKey)
        .send({
          orderId: order.id,
          method: PaymentMethod.E_WALLET,
          gateway: PaymentGateway.MOCK,
        })
        .expect(201);

      registry.paymentIds?.push(res1.body.data.id);
      const paymentId1 = res1.body.data.id;

      // Request lần 2 với cùng key và payload
      const res2 = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('idempotency-key', idempotencyKey)
        .send({
          orderId: order.id,
          method: PaymentMethod.E_WALLET,
          gateway: PaymentGateway.MOCK,
        })
        .expect(201);

      // Phải trả về cùng ID payment đã tạo ở lần 1
      expect(res2.body.data.id).toBe(paymentId1);

      // Đảm bảo trong database chỉ tồn tại đúng 1 payment record cho key này
      const count = await prisma.payment.count({
        where: { idempotencyKey },
      });
      expect(count).toBe(1);
    });

    it('gửi cùng idempotency-key nhưng khác payload sẽ bị từ chối 409 Conflict', async () => {
      const { user, token } = await createTestCustomer();
      const order1 = await createTestOrder(user.id, 45000, OrderStatus.PENDING);
      const order2 = await createTestOrder(user.id, 45000, OrderStatus.PENDING);
      const sharedKey = generateTestIdentifier('idemp_conflict');

      // Dùng sharedKey cho order1
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('idempotency-key', sharedKey)
        .send({
          orderId: order1.id,
          method: PaymentMethod.E_WALLET,
          gateway: PaymentGateway.MOCK,
        })
        .expect(201);

      registry.paymentIds?.push(res1.body.data.id);

      // Dùng lại sharedKey cho order2 -> 409 Conflict
      const resConflict = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('idempotency-key', sharedKey)
        .send({
          orderId: order2.id,
          method: PaymentMethod.E_WALLET,
          gateway: PaymentGateway.MOCK,
        })
        .expect(409);

      expect(resConflict.body.success).toBe(false);
      expect(resConflict.body.statusCode).toBe(409);
    });
  });

  describe('TC-PAY-04: VNPay IPN Callback (Xác thực chữ ký & Chống callback lặp)', () => {
    it('từ chối mã RspCode 97 khi callback VNPay sai chữ ký checksum', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query({
          vnp_TxnRef: 'txn_invalid_sig',
          vnp_Amount: '5000000',
          vnp_ResponseCode: '00',
          vnp_SecureHash: 'invalid_tampered_hash_123',
        });

      // API trả về JSON { RspCode: '97', Message: 'Invalid signature' }
      expect(res.body.data).toEqual({
        RspCode: '97',
        Message: 'Invalid signature',
      });
    });

    it('từ chối mã RspCode 99 khi callback VNPay thiếu dữ liệu bắt buộc', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query({});

      expect(res.body.data.RspCode).toBe('97');
    });
  });

  describe('TC-PAY-05: Security, Validation & Business Guards', () => {
    it('từ chối 401 Unauthorized khi không truyền Bearer JWT token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send({
          orderId: 'any-order-id',
          method: PaymentMethod.E_WALLET,
        })
        .expect(401);
    });

    it('từ chối 400 Bad Request khi thiếu header Idempotency-Key', async () => {
      const { user, token } = await createTestCustomer();
      const order = await createTestOrder(user.id);

      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: order.id,
          method: PaymentMethod.E_WALLET,
        })
        .expect(400);
    });

    it('từ chối 404 Not Found khi đơn hàng không tồn tại hoặc thuộc người dùng khác', async () => {
      const customerA = await createTestCustomer();
      const customerB = await createTestCustomer();
      const orderB = await createTestOrder(customerB.user.id);

      // Customer A cố tình thanh toán đơn của Customer B
      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${customerA.token}`)
        .set('idempotency-key', generateTestIdentifier('cross_user'))
        .send({
          orderId: orderB.id,
          method: PaymentMethod.E_WALLET,
          gateway: PaymentGateway.MOCK,
        })
        .expect(404);
    });

    it('từ chối 409 Conflict khi đơn hàng đã thanh toán PAID trước đó', async () => {
      const { user, token } = await createTestCustomer();
      // Đơn hàng đã ở trạng thái PAID
      const paidOrder = await createTestOrder(user.id, 60000, OrderStatus.PAID);

      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('idempotency-key', generateTestIdentifier('paid_order'))
        .send({
          orderId: paidOrder.id,
          method: PaymentMethod.E_WALLET,
          gateway: PaymentGateway.MOCK,
        })
        .expect(409);
    });
  });
});

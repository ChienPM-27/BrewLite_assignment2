import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import {
  cleanupTestData,
  createNestTestApp,
  generateTestIdentifier,
  TestDataRegistry,
} from '../../../test/test-helper';

describe('Auth Module Integration Tests (FR-01..03 / SP2-05)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const registry: TestDataRegistry = {
    userIds: [],
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

  describe('FR-01: POST /api/v1/auth/register', () => {
    it('[TC-AUTH-01][TC-AUTH-02] (AC-01.1, AC-01.2): đăng ký thành công trả về 201 Created, băm mật khẩu bcrypt 10 rounds và không lưu plaintext', async () => {
      const uniquePrefix = generateTestIdentifier('reg_user');
      const rawEmail = `  ${uniquePrefix.toUpperCase()}@BrewLite.Test  `;
      const expectedEmail = `${uniquePrefix.toLowerCase()}@brewlite.test`;
      const plainPassword = 'Password@123';

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: rawEmail,
          password: plainPassword,
          fullName: '  Quach Tuan Hao  ',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.user).toEqual({
        id: expect.any(String),
        email: expectedEmail,
        fullName: 'Quach Tuan Hao',
        role: Role.CUSTOMER,
        loyaltyPoints: 0,
      });
      expect(res.body.data.user).not.toHaveProperty('passwordHash');

      const createdUserId: string = res.body.data.user.id;
      registry.userIds?.push(createdUserId);

      // Kiểm chứng trực tiếp trong Database: không lưu plaintext, băm đúng bcrypt rounds = 10
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUserId },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).not.toBe(plainPassword);
      expect(dbUser?.passwordHash).toMatch(/^\$2[ab]\$10\$/);
      const isMatch = await bcrypt.compare(
        plainPassword,
        dbUser?.passwordHash ?? '',
      );
      expect(isMatch).toBe(true);
    });

    it('[TC-AUTH-03] (AC-01.3): đăng ký trùng email đã tồn tại trả về 409 Conflict', async () => {
      const uniqueEmail = `${generateTestIdentifier('dup_user')}@brewlite.test`;

      const firstRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: uniqueEmail,
          password: 'Password123',
          fullName: 'First User',
        })
        .expect(201);

      registry.userIds?.push(firstRes.body.data.user.id);

      // Gửi lại cùng email (viết hoa) phải bị chặn 409 Conflict
      const conflictRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: uniqueEmail.toUpperCase(),
          password: 'AnotherPassword123',
          fullName: 'Duplicate User',
        })
        .expect(409);

      expect(conflictRes.body.success).toBe(false);
      expect(conflictRes.body.statusCode).toBe(409);
    });

    it('[TC-AUTH-08] (AC-01.4): từ chối 400 Bad Request khi dữ liệu không hợp lệ hoặc cố tình gửi trường "role"', async () => {
      const attackerEmail = `${generateTestIdentifier('attacker')}@brewlite.test`;

      // Cố tình truyền role: ADMIN (Mass Assignment)
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: attackerEmail,
          password: 'Password123',
          role: 'ADMIN',
        })
        .expect(400);

      // Mật khẩu ngắn hơn 6 ký tự
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: attackerEmail,
          password: '123',
        })
        .expect(400);

      // Email sai định dạng
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email-format',
          password: 'Password123',
        })
        .expect(400);
    });
  });

  describe('FR-02: POST /api/v1/auth/login', () => {
    let loginEmail: string;
    const loginPassword = 'LoginSecret@123';
    let registeredUserId: string;

    beforeAll(async () => {
      loginEmail = `${generateTestIdentifier('login_user')}@brewlite.test`;
      const passwordHash = await bcrypt.hash(loginPassword, 10);

      const user = await prisma.user.create({
        data: {
          email: loginEmail,
          passwordHash,
          fullName: 'Login Test User',
          role: Role.CUSTOMER,
          loyaltyPoints: 15,
        },
      });
      registeredUserId = user.id;
      registry.userIds?.push(user.id);
    });

    it('[TC-AUTH-04] (AC-02.1): đăng nhập đúng trả về 200 OK kèm JWT accessToken chứa { sub, email, role }', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `  ${loginEmail.toUpperCase()}  `,
          password: loginPassword,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toEqual({
        id: registeredUserId,
        email: loginEmail,
        fullName: 'Login Test User',
        role: Role.CUSTOMER,
        loyaltyPoints: 15,
      });

      const decoded = jwtService.verify<{
        sub: string;
        email: string;
        role: Role;
      }>(res.body.data.accessToken);
      expect(decoded.sub).toBe(registeredUserId);
      expect(decoded.email).toBe(loginEmail);
      expect(decoded.role).toBe(Role.CUSTOMER);
    });

    it('[TC-AUTH-05] (AC-02.2): đăng nhập sai mật khẩu hoặc email không tồn tại trả về 401 Unauthorized', async () => {
      // Sai mật khẩu
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: loginEmail,
          password: 'WrongPassword999',
        })
        .expect(401);

      // Email không tồn tại
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `nonexistent_${generateTestIdentifier('ghost')}@brewlite.test`,
          password: loginPassword,
        })
        .expect(401);
    });

    it('[TC-AUTH-09] (AC-02.3): đăng nhập thiếu thông tin hoặc sai định dạng email trả về 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: '',
        })
        .expect(400);
    });
  });

  describe('FR-03: Bảo vệ tuyến API & Phân quyền RBAC (JwtAuthGuard & RolesGuard)', () => {
    let customerId: string;
    let customerEmail: string;
    let adminId: string;
    let adminEmail: string;

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash('GuardSecret@123', 10);

      customerEmail = `${generateTestIdentifier('cust_guard')}@brewlite.test`;
      const customer = await prisma.user.create({
        data: {
          email: customerEmail,
          passwordHash,
          fullName: 'Customer Guard User',
          role: Role.CUSTOMER,
        },
      });
      customerId = customer.id;
      registry.userIds?.push(customer.id);

      adminEmail = `${generateTestIdentifier('admin_guard')}@brewlite.test`;
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          fullName: 'Admin Guard User',
          role: Role.ADMIN,
        },
      });
      adminId = admin.id;
      registry.userIds?.push(admin.id);
    });

    it('[TC-AUTH-06] (AC-03.1): truy cập route bảo vệ không có Bearer token trả về 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/admin-ping')
        .expect(401);
    });

    it('[TC-AUTH-10] (AC-03.2): truy cập với token đã hết hạn hoặc sai chữ ký trả về 401 Unauthorized', async () => {
      // Token đã hết hạn
      const expiredToken = await jwtService.signAsync(
        { sub: adminId, email: adminEmail, role: Role.ADMIN },
        { expiresIn: '-10s' },
      );

      await request(app.getHttpServer())
        .get('/api/v1/auth/admin-ping')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Token ký sai secret
      const forgedToken = await jwtService.signAsync(
        { sub: adminId, email: adminEmail, role: Role.ADMIN },
        { secret: 'invalid-forged-secret-key' },
      );

      await request(app.getHttpServer())
        .get('/api/v1/auth/admin-ping')
        .set('Authorization', `Bearer ${forgedToken}`)
        .expect(401);
    });

    it('[TC-AUTH-07] (AC-03.3): CUSTOMER gọi route quản trị trả về 403 Forbidden; ADMIN gọi trả về 200 OK', async () => {
      const customerToken = await jwtService.signAsync({
        sub: customerId,
        email: customerEmail,
        role: Role.CUSTOMER,
      });

      await request(app.getHttpServer())
        .get('/api/v1/auth/admin-ping')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      const adminToken = await jwtService.signAsync({
        sub: adminId,
        email: adminEmail,
        role: Role.ADMIN,
      });

      const adminRes = await request(app.getHttpServer())
        .get('/api/v1/auth/admin-ping')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data).toEqual({ ok: true });
    });
  });
});

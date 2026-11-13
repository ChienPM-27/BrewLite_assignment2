import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createNestTestApp } from './test-helper';

describe('Health Check Endpoint (Integration Test via Supertest)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/health trả về 200 OK và status ok qua Supertest', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toEqual({ status: 'ok' });
    expect(res.body.success).toBe(true);
  });

  it('Không công khai thông tin đăng nhập Sandbox qua endpoint hỗ trợ cũ', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/payments/vnpay/tunnel-info')
      .expect(404);

    expect(res.body).not.toHaveProperty('data');
  });
});

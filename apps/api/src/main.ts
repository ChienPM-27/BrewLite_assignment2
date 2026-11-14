import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

(Prisma.Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS cho Next.js Frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. Global Prefix REST API (/api/v1)
  app.setGlobalPrefix('api/v1');

  // 3. Global Validation Pipe (Class Validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. Global Response Transform Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // 5. Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 6. Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('☕ BrewLite API Documentation')
    .setDescription(
      'Hệ thống REST API cho nền tảng đặt cà phê và thanh toán không tiền mặt BrewLite (SGU - Công nghệ Phần mềm).\n\n' +
        '### 🔑 Tài khoản mẫu phục vụ kiểm thử (Seed Data):\n' +
        '- **Khách hàng (Customer):** `demo@brewlite.test` | Mật khẩu: `Demo@12345` (có sẵn 120 điểm loyalty)\n' +
        '- **Quản lý / Barista (Admin):** `admin@brewlite.com` | Mật khẩu: `Admin@123456`\n\n' +
        '### 🎟️ Mã giảm giá thử nghiệm:\n' +
        '- `WELCOME10`: Giảm 10% (tối đa 20.000đ cho đơn từ 40.000đ)\n' +
        '- `GIAM15K`: Giảm 15.000đ trực tiếp (cho đơn từ 60.000đ)',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập access token nhận được từ API /api/v1/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
    customSiteTitle: 'BrewLite API Documentation',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(
    `🚀 BrewLite Backend đang chạy tại: http://localhost:${port}/api/v1`,
  );
  console.log(
    `📑 Swagger UI Documentation tại: http://localhost:${port}/api/docs`,
  );
}
bootstrap();

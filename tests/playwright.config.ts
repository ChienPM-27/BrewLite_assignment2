import { defineConfig } from '@playwright/test';

/**
 * Cấu hình E2E theo ADR-009 mục 3.4:
 * - baseURL lấy từ E2E_BASE_URL để cùng bộ test chạy được local, CI và production.
 * - Chromium với viewport mobile (< 1024px): trang thanh toán chỉ hiện một nút "Xác nhận thanh toán".
 *   Chỉ đặt kích thước viewport, không giả lập thiết bị (isMobile), vì ở chế độ đó trang thanh toán
 *   bị tràn ngang và cú bấm vào thanh nút cố định ở đáy rơi vào phần tử khác.
 * - CI: retries 1, trace khi retry, ảnh chụp khi fail. Test chỉ xanh sau retry là flaky
 *   và phải có issue sửa, không tăng retries để che lỗi.
 */
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [['list'], ['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mobile-viewport',
      use: { browserName: 'chromium', viewport: { width: 412, height: 915 } },
    },
  ],
});

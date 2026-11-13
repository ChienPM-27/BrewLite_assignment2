import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { vnd } from './money';
import { recordCreated, type Customer, type FixtureManifest, type ProductSize } from './run';

/**
 * Các bước người dùng dùng chung cho kịch bản E2E. Selector theo role/label/chữ hiển thị
 * trong apps/web hiện tại (ADR-009 mục 3.4), không dùng class Tailwind.
 */

export interface CreatedOrder {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface PaymentResult {
  id: string;
  status: string;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Web và API khác origin nên so khớp response theo method + pathname (bỏ qua preflight OPTIONS). */
export function isApi(method: string, pathname: string) {
  return (response: Response): boolean =>
    response.request().method() === method &&
    new URL(response.url()).pathname === `/api/v1${pathname}`;
}

/** API bọc kết quả trong { success, statusCode, data } (TransformInterceptor). */
export async function readData<T>(response: Response): Promise<T> {
  const body = (await response.json()) as { data: T };
  return body.data;
}

export function expectedUnitPrice(
  manifest: FixtureManifest,
  size: ProductSize,
  withTopping: boolean,
): number {
  return (
    manifest.product.basePrice +
    manifest.product.sizePrices[size] +
    (withTopping ? manifest.topping.price : 0)
  );
}

/** Link giỏ hàng trên Navbar có aria-label "Giỏ hàng, <n> món". */
export function cartLink(page: Page, count: number): Locator {
  return page.getByRole('link', { name: `Giỏ hàng, ${count} món`, exact: true });
}

/** Trang đăng ký gọi POST /auth/register rồi tự đăng nhập bằng accessToken trả về. */
export async function registerCustomer(page: Page, customer: Customer): Promise<void> {
  await page.goto('/auth/register');
  await page.getByLabel(/^Email/).fill(customer.email);
  await page.getByLabel(/^Mật khẩu/).fill(customer.password);
  await page.getByLabel(/^Xác nhận mật khẩu/).fill(customer.password);

  const registered = page.waitForResponse(isApi('POST', '/auth/register'));
  await page.getByRole('button', { name: 'Đăng ký tài khoản' }).click();
  const response = await registered;
  expect(response.ok(), `POST /auth/register trả HTTP ${response.status()}`).toBeTruthy();

  const data = await readData<{ user: { id: string; email: string } }>(response);
  recordCreated({ type: 'user', id: data.user.id, email: data.user.email });
  await expect(page).toHaveURL(/\/menu$/);
}

export async function loginCustomer(page: Page, customer: Customer): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel(/^Email/).fill(customer.email);
  await page.getByLabel(/^Mật khẩu/).fill(customer.password);

  const loggedIn = page.waitForResponse(isApi('POST', '/auth/login'));
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const response = await loggedIn;
  expect(response.ok(), `POST /auth/login trả HTTP ${response.status()}`).toBeTruthy();
  await expect(page).toHaveURL(/\/menu$/);
}

/** Menu → tìm món fixture theo runId → chi tiết → chọn size/topping → thêm giỏ. Trả về đơn giá. */
export async function addFixtureProductToCart(
  page: Page,
  manifest: FixtureManifest,
  options: { size: ProductSize; withTopping: boolean },
): Promise<number> {
  await page.goto('/menu');
  await page.getByRole('searchbox', { name: 'Tìm món trong thực đơn' }).fill(manifest.runId);
  await page.getByRole('link', { name: `Xem chi tiết ${manifest.product.name}` }).click();
  await expect(page).toHaveURL(new RegExp(`/products/${manifest.product.id}$`));

  const sizeOption = page.getByRole('radio', { name: new RegExp(`^Size ${options.size}\\b`) });
  await sizeOption.click();
  await expect(sizeOption).toHaveAttribute('aria-checked', 'true');

  if (options.withTopping) {
    // Checkbox topping bị ẩn trực quan (sr-only) trong <label>; bấm vào tên topping như người dùng.
    await page.getByText(manifest.topping.name, { exact: true }).click();
    await expect(
      page.getByRole('checkbox', { name: new RegExp(escapeRegExp(manifest.topping.name)) }),
    ).toBeChecked();
  }

  const unitPrice = expectedUnitPrice(manifest, options.size, options.withTopping);
  const addButton = page.getByRole('button', { name: /^Thêm vào giỏ hàng/ });
  await expect(addButton).toContainText(vnd(unitPrice));
  await addButton.click();
  await expect(page.getByText('Đã thêm vào giỏ hàng!')).toBeVisible();
  return unitPrice;
}

export async function proceedFromCart(
  page: Page,
  manifest: FixtureManifest,
  expectedSubtotal: number,
): Promise<void> {
  await page.goto('/cart');
  await expect(page.getByText(manifest.product.name).first()).toBeVisible();
  await expect(page.getByText(vnd(expectedSubtotal)).first()).toBeVisible();
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
}

export async function placeOrder(page: Page): Promise<CreatedOrder> {
  const created = page.waitForResponse(isApi('POST', '/orders'));
  await page.getByRole('button', { name: 'Đặt hàng (Chuyển sang thanh toán)' }).click();
  const response = await created;
  expect(response.status(), 'POST /orders phải trả 201').toBe(201);

  const order = await readData<CreatedOrder>(response);
  recordCreated({ type: 'order', id: order.id, orderNumber: order.orderNumber });
  await expect(page).toHaveURL(new RegExp(`/checkout/payment\\?orderId=${order.id}$`));
  return order;
}

/** Thanh toán qua cổng MOCK (mặc định của trang) bằng nút mô phỏng trong MockGatewayModal. */
export async function payWithMockGateway(
  page: Page,
  order: CreatedOrder,
  outcome: 'SUCCESS' | 'FAILED',
): Promise<{ payment: PaymentResult; mockOutcomeHeader: string | undefined }> {
  // Khung mobile: chỉ thanh dính đáy hiển thị nút này (nút desktop bị ẩn).
  const payButton = page.getByRole('button', { name: /^Xác nhận thanh toán/ });
  await expect(payButton).toBeVisible();
  await expect(payButton).toContainText(vnd(order.finalAmount));
  await payButton.click();

  const gateway = page.getByRole('dialog');
  await expect(gateway).toBeVisible();
  const paid = page.waitForResponse(isApi('POST', '/payments'));
  // Chữ trên nút đổi theo phương thức (QR cho Ví điện tử, OTP cho Thẻ) nên so bằng regex.
  await gateway
    .getByRole('button', {
      name: outcome === 'SUCCESS' ? /^Mô phỏng: .*thành công$/ : /^Mô phỏng: (Quét lỗi|Sai OTP)/,
    })
    .click();

  const response = await paid;
  expect(response.ok(), `POST /payments trả HTTP ${response.status()}`).toBeTruthy();
  const payment = await readData<PaymentResult>(response);
  recordCreated({ type: 'payment', id: payment.id, orderId: order.id, status: payment.status });

  const headers = await response.request().allHeaders();
  return { payment, mockOutcomeHeader: headers['x-mock-outcome'] };
}

/** Link "Đơn hàng của tôi" trong thanh điều hướng di động (chỉ hiện khi đã đăng nhập). */
export async function openMyOrders(page: Page): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Điều hướng chính (di động)' })
    .getByRole('link', { name: 'Đơn hàng của tôi' })
    .click();
  await expect(page).toHaveURL(/\/orders$/);
}

/** Thẻ đơn trong /orders: phần tử sâu nhất chứa cả "#<orderNumber>" và link "Xem chi tiết". */
export function orderCard(page: Page, orderNumber: number): Locator {
  return page
    .locator('div')
    .filter({ hasText: `#${orderNumber}` })
    .filter({ has: page.getByRole('link', { name: 'Xem chi tiết' }) })
    .last();
}

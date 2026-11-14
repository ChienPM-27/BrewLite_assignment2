import { expect, test } from '@playwright/test';
import {
  addFixtureProductToCart,
  cartLink,
  isApi,
  orderCard,
  payWithMockGateway,
  placeOrder,
  proceedFromCart,
  registerCustomer,
} from './support/flows';
import { loadManifest, newCustomer } from './support/run';

/**
 * E2E-02 (ADR-009 mục 3.4): user mới riêng, như E2E-01 tới trang thanh toán, mô phỏng lỗi
 * (UI tự gửi X-Mock-Outcome: FAILED) → giỏ giữ nguyên → hủy đơn.
 */
test('[E2E-02][TC-CART-04] thanh toán MOCK thất bại giữ nguyên giỏ, hủy đơn về giỏ hàng', async ({ page }) => {
  const manifest = loadManifest();
  const customer = newCustomer(manifest);

  await registerCustomer(page, customer);
  const unitPrice = await addFixtureProductToCart(page, manifest, { size: 'M', withTopping: true });
  await proceedFromCart(page, manifest, unitPrice);
  const order = await placeOrder(page);

  const { payment, mockOutcomeHeader } = await payWithMockGateway(page, order, 'FAILED');
  expect(mockOutcomeHeader).toBe('FAILED');
  expect(payment.status).toBe('FAILED');

  // Vẫn ở trang thanh toán, có thông báo lỗi, giỏ giữ nguyên.
  await expect(page).toHaveURL(new RegExp(`/checkout/payment\\?orderId=${order.id}$`));
  await expect(page.getByRole('heading', { name: 'Giao dịch chưa hoàn tất' })).toBeVisible();
  await expect(cartLink(page, 1)).toBeVisible();

  // Nút "Hủy đơn hàng này" có ở khung lỗi và cuối trang; dùng nút đầu tiên (khung lỗi).
  const cancelled = page.waitForResponse(isApi('POST', `/orders/${order.id}/cancel`));
  await page.getByRole('button', { name: 'Hủy đơn hàng này' }).first().click();
  const cancelResponse = await cancelled;
  expect(cancelResponse.ok(), `Hủy đơn trả HTTP ${cancelResponse.status()}`).toBeTruthy();

  // Sau khi hủy: về /cart, giỏ vẫn còn món.
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByText(manifest.product.name).first()).toBeVisible();
  await expect(cartLink(page, 1)).toBeVisible();

  await page.goto('/orders');
  await expect(orderCard(page, order.orderNumber).getByText('Đã hủy', { exact: true })).toBeVisible();
});

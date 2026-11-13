import { expect, test } from '@playwright/test';
import {
  addFixtureProductToCart,
  cartLink,
  loginCustomer,
  openMyOrders,
  orderCard,
  payWithMockGateway,
  placeOrder,
  proceedFromCart,
  registerCustomer,
  type CreatedOrder,
} from './support/flows';
import { vnd } from './support/money';
import { loadManifest, newCustomer, type Customer } from './support/run';

/**
 * E2E-01 và E2E-03 (ADR-009 mục 3.4) cùng một nhóm serial: E2E-03 dùng lại user và đơn của E2E-01.
 * Nếu E2E-01 fail, Playwright bỏ qua E2E-03; khi retry, cả nhóm chạy lại từ đầu.
 */
test.describe.configure({ mode: 'serial' });

test.describe('Đặt món, thanh toán thành công và xem đơn của tôi', () => {
  let customer: Customer;
  let order: CreatedOrder;

  test('[E2E-01] đăng ký, chọn size + topping, đặt đơn và thanh toán MOCK thành công', async ({ page }) => {
    const manifest = loadManifest();
    customer = newCustomer(manifest);

    await registerCustomer(page, customer);
    const unitPrice = await addFixtureProductToCart(page, manifest, { size: 'M', withTopping: true });
    await proceedFromCart(page, manifest, unitPrice);
    order = await placeOrder(page);

    // Tổng tiền hiển thị trên UI phải bằng tổng do backend tính.
    expect(order.status).toBe('PENDING');
    expect(order.totalAmount).toBe(unitPrice);
    expect(order.finalAmount).toBe(order.totalAmount - order.discountAmount);
    expect(order.finalAmount).toBe(unitPrice);

    const { payment } = await payWithMockGateway(page, order, 'SUCCESS');
    expect(payment.status).toBe('SUCCESS');

    await expect(page).toHaveURL(new RegExp(`/orders/${order.id}\\?paid=1$`));
    await expect(page.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: `Đơn hàng #${order.orderNumber}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible();
    // Giỏ được xóa sau khi thanh toán thành công.
    await expect(cartLink(page, 0)).toBeVisible();
  });

  test('[E2E-03][TC-HIST-13] mở "Đơn hàng của tôi" và xem chi tiết đơn vừa đặt', async ({ page }) => {
    const manifest = loadManifest();

    await loginCustomer(page, customer);
    await openMyOrders(page);

    // Đơn vừa đặt đứng đầu danh sách, nhãn "Đã thanh toán", số món và finalAmount (AC-21.13).
    await expect(page.getByRole('link', { name: 'Xem chi tiết' }).first()).toHaveAttribute(
      'href',
      `/orders/${order.id}`,
    );
    const card = orderCard(page, order.orderNumber);
    await expect(card.getByText('Đã thanh toán', { exact: true })).toBeVisible();
    await expect(card.getByText('1 món')).toBeVisible();
    await expect(card.getByText(vnd(order.finalAmount))).toBeVisible();

    await card.getByRole('link', { name: 'Xem chi tiết' }).click();
    await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`));
    await expect(
      page.getByRole('heading', { name: `Đơn hàng #${order.orderNumber}`, exact: true }),
    ).toBeVisible();
    // FR-22 chỉ hiển thị trạng thái hiện tại; không kiểm tra lịch sử chuyển trạng thái.
    await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible();

    const itemRow = page.getByRole('row').filter({ hasText: manifest.product.name });
    await expect(itemRow).toContainText(manifest.topping.name);
    await expect(itemRow.getByRole('cell', { name: 'M', exact: true })).toBeVisible();
    // Dòng "Tổng thanh toán" phải bằng finalAmount (cùng số tiền còn xuất hiện ở thành tiền/tổng tiền hàng).
    const totalRow = page.locator('div').filter({ hasText: 'Tổng thanh toán:' }).last();
    await expect(totalRow).toContainText(vnd(order.finalAmount));

    await expect(page.getByRole('heading', { name: 'Lịch sử giao dịch thanh toán' })).toBeVisible();
    await expect(page.getByText('Thành công', { exact: true })).toBeVisible();
  });
});

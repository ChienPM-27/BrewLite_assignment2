import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ProductCatalogView from '@/components/product-catalog/ProductCatalogView';
import { getProductCatalog } from '@/services/product.service';

// Giả lập hàm gọi API
vi.mock('@/services/product.service', () => ({
  getProductCatalog: vi.fn(),
}));

const mockGetProducts = vi.mocked(getProductCatalog);

// Xóa lịch sử gọi hàm sau mỗi test
afterEach(() => {
  vi.clearAllMocks();
});

describe('Kiểm thử các trạng thái Menu', () => {

  // TEST 1: LOADING
  it('TC-MENU-01: Hiển thị loading', () => {
    // 1. Giả lập API đang tải, chưa trả kết quả
    mockGetProducts.mockReturnValue(new Promise(() => {}));
    // 2. Hiển thị Menu
    render(<ProductCatalogView />);
    // 3. Kiểm tra loading
    expect(
      screen.getByRole('status', { name: 'Đang tải thực đơn' })
    ).toBeInTheDocument();
  });

  // TEST 2: EMPTY
  it('TC-MENU-11: Hiển thị Menu rỗng', async () => {
    // 1. Giả lập API trả danh sách rỗng
    mockGetProducts.mockResolvedValueOnce([]);
    // 2. Hiển thị Menu
    render(<ProductCatalogView />);
    // 3. Kiểm tra thông báo
    expect(
      await screen.findByText('Chưa có sản phẩm mở bán')
    ).toBeInTheDocument();
  });

  // TEST 3: ERROR + RETRY
  it('TC-MENU-12: Hiển thị lỗi và thử lại', async () => {
    // 1. Lần đầu API lỗi, lần sau trả danh sách rỗng
    mockGetProducts
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce([]);
    // 2. Hiển thị Menu
    render(<ProductCatalogView />);
    // 3. Kiểm tra thông báo lỗi
    expect(
      await screen.findByText('Không thể tải thực đơn')
    ).toBeInTheDocument();
    // 4. Nhấn nút thử lại
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    // 5. Kiểm tra API được gọi 2 lần
    await waitFor(() => {
      expect(mockGetProducts).toHaveBeenCalledTimes(2);
    });
    // 6. Kiểm tra Menu hiển thị sau khi thử lại
    expect(
      await screen.findByText('Chưa có sản phẩm mở bán')
    ).toBeInTheDocument();
  });

});
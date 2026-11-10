import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductDetailPage from './page';
import { ApiError } from '@/lib/api-client';
import { getProductById } from '@/services/product.service';
import { useCartStore } from '@/store/useCartStore';
import { ProductDetail, ProductSize } from '@/types/product';

vi.mock('@/services/product.service', () => ({
  getProductById: vi.fn(),
}));

const mockedGetProductById = vi.mocked(getProductById);

function createMockProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 'test-prod-cf-sua-da',
    name: 'Cà phê sữa đá Test',
    imageUrl: 'https://example.com/ca-phe-sua-da.jpg',
    basePrice: 35000,
    currency: 'VND',
    isAvailable: true,
    categoryName: 'Cà phê truyền thống',
    sizePrices: [
      { size: ProductSize.S, priceAdjustment: 0 },
      { size: ProductSize.M, priceAdjustment: 5000 },
      { size: ProductSize.L, priceAdjustment: 10000 },
    ],
    toppings: [
      { id: 'test-top-1', name: 'Trân châu trắng', price: 5000 },
      { id: 'test-top-2', name: 'Kem Cheese', price: 10000 },
      { id: 'test-top-3', name: 'Đào miếng', price: 8000 },
      { id: 'test-top-4', name: 'Thạch cà phê', price: 6000 },
    ],
    ...overrides,
  };
}

async function renderProductDetailPage(id = 'test-prod-cf-sua-da') {
  const pageElement = await ProductDetailPage({
    params: Promise.resolve({ id }),
  });
  let rendered!: ReturnType<typeof render>;
  await act(async () => {
    rendered = render(pageElement);
  });
  return rendered;
}

describe('ProductDetailPage (FR-07..09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useCartStore.getState().clearCart();
  });

  it('render đầy đủ thông tin sản phẩm (tên, mô tả, ảnh, giá gốc) và mặc định chọn Size S (AC-07.1, AC-08.1)', async () => {
    const product = createMockProduct();
    mockedGetProductById.mockResolvedValueOnce(product);

    await renderProductDetailPage(product.id);

    const heading = screen.getByRole('heading', {
      level: 1,
      name: product.name,
    });
    expect(heading).toBeInTheDocument();

    // Mô tả sản phẩm
    expect(
      screen.getByText(/Hương vị cà phê Robusta Buôn Ma Thuột đậm đà/i),
    ).toBeInTheDocument();

    // Ảnh chính của sản phẩm
    const productImg = screen.getByRole('img', { name: product.name });
    expect(productImg).toHaveAttribute('src', product.imageUrl);

    // Giá gốc & mặc định chọn Size S
    expect(screen.getByText('Giá gốc ly Size S')).toBeInTheDocument();
    expect(screen.getAllByText('35.000đ').length).toBeGreaterThanOrEqual(2);
    const sizeGroup = screen.getByRole('radiogroup', { name: 'Chọn size' });
    const sizeSRadio = within(sizeGroup).getByRole('radio', { name: /Size S/i });
    expect(sizeSRadio).toHaveAttribute('aria-checked', 'true');

    // Bảng kê giá và CTA hiển thị giá mặc định Size S = 35.000đ
    const addToCartBtn = screen.getByRole('button', {
      name: /Thêm vào giỏ hàng – 35\.000đ/i,
    });
    expect(addToCartBtn).toBeEnabled();
  });

  it('cập nhật giá realtime khi người dùng đổi Size S -> M -> L (AC-08.1, AC-09.1)', async () => {
    const product = createMockProduct();
    mockedGetProductById.mockResolvedValueOnce(product);

    await renderProductDetailPage(product.id);

    const sizeGroup = screen.getByRole('radiogroup', {
      name: 'Chọn size',
    });
    const sizeMRadio = within(sizeGroup).getByRole('radio', { name: /Size M/i });
    const sizeLRadio = within(sizeGroup).getByRole('radio', { name: /Size L/i });

    // Đổi sang Size M: 35.000 + 5.000 = 40.000đ
    fireEvent.click(sizeMRadio);
    expect(sizeMRadio).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByText('40.000đ').length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole('button', { name: /Thêm vào giỏ hàng – 40\.000đ/i }),
    ).toBeEnabled();
    expect(screen.getByText('Nâng cấp Size M:')).toBeInTheDocument();

    // Đổi sang Size L: 35.000 + 10.000 = 45.000đ
    fireEvent.click(sizeLRadio);
    expect(sizeLRadio).toHaveAttribute('aria-checked', 'true');
    expect(sizeMRadio).toHaveAttribute('aria-checked', 'false');
    expect(screen.getAllByText('45.000đ').length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole('button', { name: /Thêm vào giỏ hàng – 45\.000đ/i }),
    ).toBeEnabled();
    expect(screen.getByText('Nâng cấp Size L:')).toBeInTheDocument();
  });

  it('chọn và bỏ chọn topping cập nhật tổng giá realtime và chặn chọn quá 3 topping (AC-08.2, AC-09.1 / TC-DETAIL-04)', async () => {
    const product = createMockProduct();
    mockedGetProductById.mockResolvedValueOnce(product);

    await renderProductDetailPage(product.id);

    const topping1 = screen.getByRole('checkbox', {
      name: /Trân châu trắng/i,
    });
    const topping2 = screen.getByRole('checkbox', { name: /Kem Cheese/i });
    const topping3 = screen.getByRole('checkbox', { name: /Đào miếng/i });
    const topping4 = screen.getByRole('checkbox', { name: /Thạch cà phê/i });

    // Chọn topping 1 (+5.000đ): 35.000 + 5.000 = 40.000đ
    fireEvent.click(topping1);
    expect(topping1).toBeChecked();
    expect(screen.getByText('(Đã chọn 1/3 topping)')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Thêm vào giỏ hàng – 40\.000đ/i }),
    ).toBeInTheDocument();

    // Chọn topping 2 (+10.000đ) và topping 3 (+8.000đ): 35.000 + 23.000 = 58.000đ
    fireEvent.click(topping2);
    fireEvent.click(topping3);
    expect(screen.getByText('(Đã chọn 3/3 topping)')).toBeInTheDocument();
    expect(screen.getAllByText('58.000đ').length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole('button', { name: /Thêm vào giỏ hàng – 58\.000đ/i }),
    ).toBeInTheDocument();

    // Vượt quá 3 topping: checkbox thứ 4 phải bị disable và không thể chọn thêm
    expect(topping4).toBeDisabled();
    fireEvent.click(topping4);
    expect(topping4).not.toBeChecked();
    expect(screen.getByText('(Đã chọn 3/3 topping)')).toBeInTheDocument();

    // Bỏ chọn topping 2 (-10.000đ): còn 48.000đ và topping 4 được mở khóa lại
    fireEvent.click(topping2);
    expect(topping2).not.toBeChecked();
    expect(topping4).toBeEnabled();
    expect(screen.getByText('(Đã chọn 2/3 topping)')).toBeInTheDocument();
    expect(screen.getAllByText('48.000đ').length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole('button', { name: /Thêm vào giỏ hàng – 48\.000đ/i }),
    ).toBeInTheDocument();
  });

  it('cập nhật đúng tổng giá khi thay đổi số lượng và thêm đúng item vào giỏ hàng', async () => {
    const product = createMockProduct();
    mockedGetProductById.mockResolvedValueOnce(product);

    await renderProductDetailPage(product.id);

    const sizeGroup = screen.getByRole('radiogroup', {
      name: 'Chọn size',
    });
    fireEvent.click(within(sizeGroup).getByRole('radio', { name: /Size M/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Trân châu trắng/i }));

    // Đơn giá = 35.000 + 5.000 + 5.000 = 45.000đ; tăng số lượng lên 2 -> 90.000đ
    const increaseBtn = screen.getByRole('button', { name: 'Tăng số lượng' });
    fireEvent.click(increaseBtn);

    const addBtn = screen.getByRole('button', {
      name: /Thêm vào giỏ hàng – 90\.000đ/i,
    });
    expect(addBtn).toBeEnabled();

    fireEvent.click(addBtn);

    expect(screen.getByText('Đã thêm vào giỏ hàng!')).toBeInTheDocument();
    const cartState = useCartStore.getState();
    expect(cartState.badgeCount).toBe(2);
    expect(cartState.totalAmount).toBe(90000);
    expect(cartState.items[0]).toMatchObject({
      productId: product.id,
      size: ProductSize.M,
      toppingIds: ['test-top-1'],
      quantity: 2,
      estimatedUnitPrice: 45000,
    });
  });

  it('disable nút thêm vào giỏ hàng khi thiếu dữ liệu size bắt buộc hoặc sản phẩm ngừng bán', async () => {
    // Trường hợp 1: Thiếu thuộc tính size bắt buộc (sizePrices rỗng -> size = null)
    const missingSizeProduct = createMockProduct({
      id: 'test-prod-no-size',
      sizePrices: [],
    });
    mockedGetProductById.mockResolvedValueOnce(missingSizeProduct);

    const { unmount } = await renderProductDetailPage(missingSizeProduct.id);

    const missingSizeBtn = screen.getByRole('button', {
      name: 'Chưa thể thêm vào giỏ',
    });
    expect(missingSizeBtn).toBeDisabled();
    expect(
      screen.getByText(
        'Không thể tính giá do thiếu dữ liệu size. Vui lòng chọn size.',
      ),
    ).toBeInTheDocument();

    unmount();

    // Trường hợp 2: Sản phẩm hết hàng / ngừng bán (isAvailable = false)
    const soldOutProduct = createMockProduct({
      id: 'test-prod-sold-out',
      isAvailable: false,
    });
    mockedGetProductById.mockResolvedValueOnce(soldOutProduct);

    await renderProductDetailPage(soldOutProduct.id);

    const soldOutBtn = screen.getByRole('button', {
      name: 'Sản phẩm không còn bán',
    });
    expect(soldOutBtn).toBeDisabled();
  });

  it('hiển thị trạng thái lỗi 404 khi sản phẩm không tồn tại (AC-07.2)', async () => {
    mockedGetProductById.mockRejectedValueOnce(
      new ApiError('Không tìm thấy sản phẩm', 404),
    );

    await renderProductDetailPage('test-prod-missing');

    expect(screen.getByText('Không tìm thấy sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('Lỗi 404')).toBeInTheDocument();
  });
});


import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CartPage from './page';
import { useCartStore } from '@/store/useCartStore';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/components/cart/EditCartItemModal', () => ({
  default: ({
    isOpen,
    item,
    onClose,
    onSaved,
  }: {
    isOpen: boolean;
    item: { name: string } | null;
    onClose: () => void;
    onSaved: (msg: string) => void;
  }) =>
    isOpen && item ? (
      <div data-testid="edit-cart-item-modal">
        <span>Đang sửa: {item.name}</span>
        <button type="button" onClick={() => onSaved(`Đã cập nhật ${item.name}`)}>
          Lưu thay đổi
        </button>
        <button type="button" onClick={onClose}>
          Đóng
        </button>
      </div>
    ) : null,
}));

describe('CartPage Component (FR-10..12 / TC-CART-01..08)', () => {
  beforeEach(() => {
    pushMock.mockReset();
    window.localStorage.clear();
    useCartStore.getState().clearCart();
  });

  it('renders empty state when the cart has no items', () => {
    render(<CartPage />);

    expect(
      screen.getByRole('heading', { name: /Giỏ hàng của bạn đang trống/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Khám phá thực đơn ngay/i }),
    ).toHaveAttribute('href', '/menu');
    expect(screen.getByText(/Giỏ hàng của bạn \(0 món\)/i)).toBeInTheDocument();
  });

  it('[TC-CART-01][TC-CART-03] (AC-10.1, AC-11.1): renders cart items, size, toppings, badgeCount, and formatted VND totals', () => {
    useCartStore.getState().addItem({
      productId: 'prod-1',
      name: 'Trà Đào Cam Sả',
      imageUrl: null,
      size: 'L',
      toppingIds: ['top-1', 'top-2'],
      toppingNames: ['Trân châu trắng', 'Đào miếng'],
      quantity: 2,
      estimatedUnitPrice: 60000,
      currency: 'VND',
    });

    render(<CartPage />);

    expect(
      screen.getByRole('heading', { name: /Món đã chọn \(2\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Trà Đào Cam Sả')).toBeInTheDocument();
    expect(screen.getByText('Size L')).toBeInTheDocument();
    expect(screen.getByText('+ Trân châu trắng, Đào miếng')).toBeInTheDocument();
    // Unit price 60.000 ₫ and line total / summary total 120.000 ₫
    expect(screen.getByText(/60\.000/)).toBeInTheDocument();
    expect(screen.getAllByText(/120\.000/).length).toBeGreaterThanOrEqual(2);
  });

  it('[TC-CART-03][TC-CART-06] (AC-11.1, AC-11.2): increments and decrements item quantity via QuantityStepper and recalculates total immediately', () => {
    useCartStore.getState().addItem({
      productId: 'prod-1',
      name: 'Cà Phê Sữa Đá',
      imageUrl: null,
      size: 'M',
      toppingIds: [],
      toppingNames: [],
      quantity: 2,
      estimatedUnitPrice: 35000,
      currency: 'VND',
    });

    render(<CartPage />);

    const increaseBtn = screen.getByRole('button', { name: 'Tăng số lượng' });
    const decreaseBtn = screen.getByRole('button', { name: 'Giảm số lượng' });

    // Increment 2 -> 3 (Total: 105.000 ₫)
    fireEvent.click(increaseBtn);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(useCartStore.getState().totalAmount).toBe(105000);
    expect(
      screen.getByRole('heading', { name: /Món đã chọn \(3\)/i }),
    ).toBeInTheDocument();

    // Decrement 3 -> 2 (Total: 70.000 ₫)
    fireEvent.click(decreaseBtn);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(useCartStore.getState().totalAmount).toBe(70000);
  });

  it('[TC-CART-01] (AC-10.1): disables decrement button at quantity = 1 and increment button at quantity = 99 (Decision D5)', () => {
    useCartStore.getState().addItem({
      productId: 'prod-1',
      name: 'Americano Đá',
      imageUrl: null,
      size: 'S',
      toppingIds: [],
      toppingNames: [],
      quantity: 1,
      estimatedUnitPrice: 30000,
      currency: 'VND',
    });

    render(<CartPage />);

    const decreaseBtn = screen.getByRole('button', { name: 'Giảm số lượng' });
    const increaseBtn = screen.getByRole('button', { name: 'Tăng số lượng' });
    expect(decreaseBtn).toBeDisabled();
    expect(increaseBtn).not.toBeDisabled();

    // Update to max quantity 99
    const itemId = useCartStore.getState().items[0].id;
    act(() => {
      useCartStore.getState().updateQuantity(itemId, 99);
    });
    expect(screen.getByRole('button', { name: 'Tăng số lượng' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Giảm số lượng' })).not.toBeDisabled();
  });

  it('[TC-CART-02] (AC-10.3): clicking remove button deletes only the targeted item line', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 'prod-1',
      name: 'Bạc Xỉu',
      imageUrl: null,
      size: 'M',
      toppingIds: [],
      toppingNames: [],
      quantity: 1,
      estimatedUnitPrice: 39000,
      currency: 'VND',
    });
    store.addItem({
      productId: 'prod-2',
      name: 'Matcha Latte',
      imageUrl: null,
      size: 'L',
      toppingIds: [],
      toppingNames: [],
      quantity: 1,
      estimatedUnitPrice: 55000,
      currency: 'VND',
    });

    render(<CartPage />);

    const removeBacXiuBtn = screen.getByRole('button', { name: 'Xóa Bạc Xỉu' });
    fireEvent.click(removeBacXiuBtn);

    expect(screen.queryByText('Bạc Xỉu')).not.toBeInTheDocument();
    expect(screen.getByText('Matcha Latte')).toBeInTheDocument();
    expect(useCartStore.getState().totalAmount).toBe(55000);
  });

  it('[TC-CART-08] (AC-12.3): clicking "Xóa tất cả" clears all items and displays empty cart message', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 'prod-1',
      name: 'Bạc Xỉu',
      imageUrl: null,
      size: 'M',
      toppingIds: [],
      toppingNames: [],
      quantity: 2,
      estimatedUnitPrice: 39000,
      currency: 'VND',
    });

    render(<CartPage />);

    const clearAllBtn = screen.getByRole('button', { name: /Xóa tất cả/i });
    fireEvent.click(clearAllBtn);

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(
      screen.getByRole('heading', { name: /Giỏ hàng của bạn đang trống/i }),
    ).toBeInTheDocument();
  });

  it('[TC-CART-05] (AC-10.2): opens EditCartItemModal when clicking "Đổi Size / Topping" and shows Toast on save', () => {
    useCartStore.getState().addItem({
      productId: 'prod-1',
      name: 'Trà Sữa Ô Long',
      imageUrl: null,
      size: 'M',
      toppingIds: [],
      toppingNames: [],
      quantity: 1,
      estimatedUnitPrice: 45000,
      currency: 'VND',
    });

    render(<CartPage />);

    const editBtn = screen.getByRole('button', { name: /Đổi Size \/ Topping/i });
    fireEvent.click(editBtn);

    expect(screen.getByTestId('edit-cart-item-modal')).toBeInTheDocument();
    expect(screen.getByText('Đang sửa: Trà Sữa Ô Long')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(screen.getByText('Đã cập nhật Trà Sữa Ô Long')).toBeInTheDocument();
  });

  it('navigates to /checkout (and forwards promo query parameter when entered) on checkout click', () => {
    useCartStore.getState().addItem({
      productId: 'prod-1',
      name: 'Cold Brew Cam Vàng',
      imageUrl: null,
      size: 'M',
      toppingIds: [],
      toppingNames: [],
      quantity: 1,
      estimatedUnitPrice: 50000,
      currency: 'VND',
    });

    render(<CartPage />);

    const checkoutBtn = screen.getByRole('button', {
      name: /Tiến hành thanh toán/i,
    });

    // Without promo code
    fireEvent.click(checkoutBtn);
    expect(pushMock).toHaveBeenCalledWith('/checkout');

    // With promo code
    const promoInput = screen.getByLabelText(/Mã ưu đãi/i);
    fireEvent.change(promoInput, { target: { value: '  WELCOME10  ' } });
    fireEvent.click(checkoutBtn);

    expect(pushMock).toHaveBeenLastCalledWith('/checkout?promo=WELCOME10');
  });

  it('[TC-CART-04] (AC-12.2): keeps cart items visible on screen when returning from a failed payment with pendingOrderId', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 'prod-1',
      name: 'Espresso Đá',
      imageUrl: null,
      size: 'S',
      toppingIds: [],
      toppingNames: [],
      quantity: 2,
      estimatedUnitPrice: 35000,
      currency: 'VND',
    });
    store.setPendingOrder('order-failed-payment-99', 'sig-123');

    render(<CartPage />);

    expect(screen.getByText('Espresso Đá')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Món đã chọn \(2\)/i }),
    ).toBeInTheDocument();
  });
});

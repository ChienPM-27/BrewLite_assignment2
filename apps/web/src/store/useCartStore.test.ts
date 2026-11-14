import { beforeEach, describe, expect, it } from 'vitest';
import {
  computeCartSignature,
  MAX_QUANTITY_PER_LINE,
  useCartStore,
} from './useCartStore';

describe('useCartStore Unit Tests (FR-10..12 / SP2-05)', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.getState().clearCart();
  });

  describe('FR-10: Thêm, sửa, xóa món trong giỏ hàng (Cart Management)', () => {
    it('[TC-CART-01] (AC-10.1): thêm món cùng productId + size + toppingIds (kể cả khác thứ tự) thì gộp dòng và cộng dồn số lượng; khác size/topping thì tách dòng mới', () => {
      const store = useCartStore.getState();

      // Thêm ly thứ nhất: Size M, topping [top-b, top-a]
      store.addItem({
        productId: 'prod-latte',
        name: 'Cà Phê Latte',
        imageUrl: '/images/latte.jpg',
        size: 'M',
        toppingIds: ['top-b', 'top-a'],
        toppingNames: ['Kem Cheese', 'Trân châu trắng'],
        quantity: 2,
        estimatedUnitPrice: 55000,
        currency: 'VND',
      });

      // Thêm ly thứ hai trùng cấu hình nhưng thứ tự topping đảo ngược [top-a, top-b]
      useCartStore.getState().addItem({
        productId: 'prod-latte',
        name: 'Cà Phê Latte',
        imageUrl: '/images/latte.jpg',
        size: 'M',
        toppingIds: ['top-a', 'top-b'],
        toppingNames: ['Trân châu trắng', 'Kem Cheese'],
        quantity: 3,
        estimatedUnitPrice: 55000,
        currency: 'VND',
      });

      let state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('prod-latte-M-top-a-top-b');
      expect(state.items[0].quantity).toBe(5);
      expect(state.badgeCount).toBe(5);
      expect(state.totalAmount).toBe(275000);

      // Thêm ly cùng món nhưng khác Size (Size L) -> tách dòng mới
      useCartStore.getState().addItem({
        productId: 'prod-latte',
        name: 'Cà Phê Latte',
        imageUrl: '/images/latte.jpg',
        size: 'L',
        toppingIds: ['top-a', 'top-b'],
        toppingNames: ['Trân châu trắng', 'Kem Cheese'],
        quantity: 1,
        estimatedUnitPrice: 60000,
        currency: 'VND',
      });

      state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.badgeCount).toBe(6);
      expect(state.totalAmount).toBe(335000);
    });

    it('[TC-CART-01] (AC-10.1): giới hạn số lượng tối đa mỗi dòng không vượt quá MAX_QUANTITY_PER_LINE (99)', () => {
      useCartStore.getState().addItem({
        productId: 'prod-americano',
        name: 'Americano',
        imageUrl: null,
        size: 'S',
        toppingIds: [],
        toppingNames: [],
        quantity: 95,
        estimatedUnitPrice: 35000,
        currency: 'VND',
      });

      useCartStore.getState().addItem({
        productId: 'prod-americano',
        name: 'Americano',
        imageUrl: null,
        size: 'S',
        toppingIds: [],
        toppingNames: [],
        quantity: 20,
        estimatedUnitPrice: 35000,
        currency: 'VND',
      });

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(MAX_QUANTITY_PER_LINE);
      expect(state.badgeCount).toBe(99);
    });

    it('[TC-CART-05] (AC-10.2): updateItem cập nhật size/topping và tự động hợp nhất nếu trùng với dòng đã có trong giỏ', () => {
      // Dòng 1: Size S, không topping (SL: 2)
      useCartStore.getState().addItem({
        productId: 'prod-tea',
        name: 'Trà Đào',
        imageUrl: null,
        size: 'S',
        toppingIds: [],
        toppingNames: [],
        quantity: 2,
        estimatedUnitPrice: 40000,
        currency: 'VND',
      });

      // Dòng 2: Size L, có topping top-1 (SL: 1)
      useCartStore.getState().addItem({
        productId: 'prod-tea',
        name: 'Trà Đào',
        imageUrl: null,
        size: 'L',
        toppingIds: ['top-1'],
        toppingNames: ['Đào miếng'],
        quantity: 1,
        estimatedUnitPrice: 55000,
        currency: 'VND',
      });

      expect(useCartStore.getState().items).toHaveLength(2);

      // Sửa Dòng 1 sang Size L + topping top-1 (trùng cấu hình Dòng 2)
      useCartStore.getState().updateItem('prod-tea-S-', {
        size: 'L',
        toppingIds: ['top-1'],
        toppingNames: ['Đào miếng'],
        estimatedUnitPrice: 55000,
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('prod-tea-L-top-1');
      expect(state.items[0].quantity).toBe(3);
      expect(state.totalAmount).toBe(165000);
    });

    it('[TC-CART-02] (AC-10.3): giảm số lượng về 0 hoặc gọi removeItem sẽ xóa dòng món khỏi giỏ hàng', () => {
      useCartStore.getState().addItem({
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

      useCartStore.getState().addItem({
        productId: 'prod-2',
        name: 'Espresso',
        imageUrl: null,
        size: 'S',
        toppingIds: [],
        toppingNames: [],
        quantity: 1,
        estimatedUnitPrice: 30000,
        currency: 'VND',
      });

      // Giảm số lượng prod-1 về 0 -> tự xóa
      useCartStore.getState().updateQuantity('prod-1-M-', 0);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].productId).toBe('prod-2');

      // Gọi removeItem cho prod-2 -> giỏ trống hoàn toàn
      useCartStore.getState().removeItem('prod-2-S-');
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().totalAmount).toBe(0);
      expect(useCartStore.getState().badgeCount).toBe(0);
    });
  });

  describe('FR-11 & FR-12: Tính tổng tiền tự động, Lưu bền vững & Giữ giỏ hàng khi lỗi', () => {
    it('[TC-CART-03][TC-CART-06] (AC-11.1, AC-11.2): tính chính xác totalAmount và badgeCount tức thì khi thay đổi số lượng', () => {
      useCartStore.getState().addItem({
        productId: 'prod-cappuccino',
        name: 'Cappuccino',
        imageUrl: null,
        size: 'M',
        toppingIds: ['top-shot'],
        toppingNames: ['Thêm Shot Espresso'],
        quantity: 2,
        estimatedUnitPrice: 50000,
        currency: 'VND',
      });

      expect(useCartStore.getState().totalAmount).toBe(100000);
      expect(useCartStore.getState().badgeCount).toBe(2);

      useCartStore.getState().updateQuantity('prod-cappuccino-M-top-shot', 4);
      expect(useCartStore.getState().totalAmount).toBe(200000);
      expect(useCartStore.getState().badgeCount).toBe(4);
    });

    it('[TC-CART-07][TC-CART-04][TC-CART-08] (AC-12.1, AC-12.2, AC-12.3): lưu bền vững vào localStorage, giữ nguyên giỏ khi lỗi thanh toán và chỉ xóa khi gọi clearCart()', () => {
      useCartStore.getState().addItem({
        productId: 'prod-matcha',
        name: 'Trà Dâu',
        imageUrl: null,
        size: 'L',
        toppingIds: ['top-pearl'],
        toppingNames: ['Trân châu trắng'],
        quantity: 2,
        estimatedUnitPrice: 52000,
        currency: 'VND',
      });

      // AC-12.1: Kiểm tra dữ liệu đã được persist xuống localStorage
      const rawStored = localStorage.getItem('brewlite_cart_storage');
      expect(rawStored).not.toBeNull();
      const parsedStored = JSON.parse(rawStored ?? '{}');
      expect(parsedStored.state.items).toHaveLength(1);
      expect(parsedStored.state.totalAmount).toBe(104000);

      // AC-12.2: Khi tạo đơn PENDING và gặp lỗi thanh toán, giỏ hàng và pendingOrderId vẫn được bảo toàn
      const items = useCartStore.getState().items;
      const sig = computeCartSignature(items, ' welcome10 ');
      useCartStore.getState().setPendingOrder('order-pending-123', sig);

      expect(useCartStore.getState().pendingOrderId).toBe('order-pending-123');
      expect(useCartStore.getState().pendingCartSignature).toBe(sig);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().totalAmount).toBe(104000);

      // AC-12.3: Chỉ khi thanh toán thành công (PAID) gọi clearCart() mới xóa sạch giỏ
      useCartStore.getState().clearCart();
      const clearedState = useCartStore.getState();
      expect(clearedState.items).toHaveLength(0);
      expect(clearedState.totalAmount).toBe(0);
      expect(clearedState.badgeCount).toBe(0);
      expect(clearedState.pendingOrderId).toBeNull();
      expect(clearedState.pendingCartSignature).toBeNull();
    });
  });
});

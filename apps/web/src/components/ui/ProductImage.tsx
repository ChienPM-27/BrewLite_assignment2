'use client';

import { useState } from 'react';
import { Coffee } from 'lucide-react';

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
  /** Làm xám ảnh cho sản phẩm hết hàng. */
  muted?: boolean;
}

/**
 * Ảnh sản phẩm. Khi `imageUrl` là null hoặc tải lỗi thì hiển thị placeholder
 * (BR: imageUrl: null không phải lỗi của Product API).
 */
// Dữ liệu đã seed và giỏ hàng cũ có thể còn giữ URL ảnh trà sữa của món Trà dâu.
export function resolveProductImage(src: string | null, productName: string): string | null {
  return productName.trim().normalize('NFC').toLocaleLowerCase('vi') === 'trà dâu' &&
    src?.includes('photo-1558857563-b371033873b8')
      ? '/images/products/strawberry-tea.jpg'
      : src;
}

export default function ProductImage({ src, alt, className = '', muted = false }: ProductImageProps) {
  const imageSrc = resolveProductImage(src, alt);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!imageSrc || imageSrc === failedSrc) {
    return (
      <div
        role="img"
        aria-label={`${alt} (chưa có ảnh)`}
        className={`flex items-center justify-center bg-gradient-to-br from-primary-light to-surface-sand text-primary/50 ${className}`}
      >
        <Coffee className="h-1/4 w-1/4" aria-hidden="true" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh đến từ nhiều domain bên ngoài (seed data)
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(imageSrc)}
      className={`${className} ${muted ? 'grayscale contrast-75 brightness-95' : ''}`}
    />
  );
}

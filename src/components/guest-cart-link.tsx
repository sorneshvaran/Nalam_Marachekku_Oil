'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { getGuestCartQuantity, subscribeToGuestCart } from '@/lib/guest-cart';

export default function GuestCartLink() {
  const [quantity, setQuantity] = useState<number | null>(null);

  useEffect(() => {
    const updateQuantity = () => setQuantity(getGuestCartQuantity());
    updateQuantity();
    return subscribeToGuestCart(updateQuantity);
  }, []);

  const label = quantity === null
    ? 'Cart'
    : `Cart, ${quantity} ${quantity === 1 ? 'item' : 'items'}`;

  return (
    <Link
      className="rounded-md px-2 py-2 text-xs font-medium text-earth-700 transition hover:text-botanical-700 sm:px-1 sm:text-sm"
      href="/cart"
      aria-label={label}
    >
      {quantity === null ? 'Cart' : `Cart (${quantity})`}
    </Link>
  );
}

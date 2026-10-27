'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { mergeGuestCartAction } from '@/app/actions/cart';
import { clearGuestCart, getGuestCart, subscribeToGuestCart } from '@/lib/guest-cart';

export default function GuestCartMerge() {
  const router = useRouter();
  const mergeInFlight = useRef(false);
  const [message, setMessage] = useState('');

  const mergeSavedItems = useCallback(async () => {
    if (mergeInFlight.current) return;

    const guestItems = getGuestCart();
    if (guestItems.length === 0) {
      setMessage('');
      return;
    }

    mergeInFlight.current = true;
    try {
      const result = await mergeGuestCartAction(guestItems);
      if (!result.success) {
        setMessage(result.message);
        return;
      }

      if (!clearGuestCart()) {
        setMessage('Your cart was merged, but this browser could not clear its saved copy. Please reload only after clearing this site’s saved cart.');
        return;
      }

      setMessage('');
      router.refresh();
    } catch {
      setMessage('We could not merge your guest cart. Your items are still saved in this browser.');
    } finally {
      mergeInFlight.current = false;
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(mergeSavedItems);
    return subscribeToGuestCart(() => void mergeSavedItems());
  }, [mergeSavedItems]);

  if (!message) return null;

  return (
    <span role="alert" className="max-w-64 text-xs leading-5 text-red-800">
      {message}{' '}
      <Link className="font-semibold underline underline-offset-2" href="/cart">
        Review cart
      </Link>
    </span>
  );
}

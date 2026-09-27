'use client';
import ErrorFallback from '@/components/ErrorFallback';
export default function CashierError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} />;
}

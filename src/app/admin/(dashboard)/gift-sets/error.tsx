'use client';
import ErrorFallback from '@/components/ErrorFallback';
export default function AdminGiftSetsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} />;
}

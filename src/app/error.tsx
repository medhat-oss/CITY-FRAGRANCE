'use client';
import ErrorFallback from '@/components/ErrorFallback';
export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} />;
}

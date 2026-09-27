'use client';
import ErrorFallback from '@/components/ErrorFallback';
export default function AdminStaffError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} />;
}

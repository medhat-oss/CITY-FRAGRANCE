'use client';
import ErrorFallback from '@/components/ErrorFallback';
export default function AdminAnalyticsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} />;
}

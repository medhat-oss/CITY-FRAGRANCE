export function formatEGP(amount: number): string {
  return (
    amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' EGP'
  );
}

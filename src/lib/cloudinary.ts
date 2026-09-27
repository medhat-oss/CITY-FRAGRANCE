export async function generateSignature(params: Record<string, string>, secret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys.map((k) => k + '=' + params[k]).join('&') + secret;
  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(signStr));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

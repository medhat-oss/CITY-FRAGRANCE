/**
 * Strips non-digit and non-plus characters from a phone number string.
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Normalizes an Egyptian/international phone number for WhatsApp wa.me links.
 */
export function formatWhatsAppLink(phone: string): string {
  let p = cleanPhoneNumber(phone);
  if (p.startsWith('01')) p = '2' + p;
  else if (p.startsWith('+20')) p = p.substring(1);
  return `https://wa.me/${p}`;
}

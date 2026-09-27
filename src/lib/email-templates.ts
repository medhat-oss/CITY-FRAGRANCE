export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  email?: string;
  phoneNumber: string;
  address: string;
  apartment: string;
  city: string;
  governorate: string;
  items: OrderEmailItem[];
  totalPrice: number;
  discountCode?: string;
  discountAmount?: number;
  status: string;
  paymentMethod?: string;
}

const BRAND = '#09142E';
const GOLD = '#C5A880';
const BG = '#f4f4f4';
const WHITE = '#ffffff';

function itemRows(items: OrderEmailItem[]): string {
  return items.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${i.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:center;">${i.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;">EGP ${i.price.toFixed(2)}</td>
    </tr>`).join('');
}

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>City Fragrance</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};">
    <tr><td align="center" style="padding:20px 10px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background-color:${BRAND};padding:28px 24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="margin:0;color:${GOLD};font-size:22px;letter-spacing:2px;font-weight:400;">CITY FRAGRANCE</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background-color:${WHITE};padding:28px 24px;border-radius:0 0 8px 8px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 24px;text-align:center;font-size:12px;color:#999;">
            &copy; ${new Date().getFullYear()} City Fragrance. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function orderConfirmationHtml(data: OrderEmailData): string {
  const discountLine = data.discountAmount && data.discountAmount > 0
    ? `<tr><td style="padding:8px 12px;font-size:14px;color:#999;">Discount${data.discountCode ? ` (${data.discountCode})` : ''}</td><td style="padding:8px 12px;font-size:14px;color:#e74c3c;text-align:right;">-EGP ${data.discountAmount.toFixed(2)}</td></tr>`
    : '';

  const content = `
    <p style="margin:0 0 6px 0;font-size:16px;color:#333;">Thank you for your order, <strong>${data.customerName}</strong>!</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#666;">Your order has been placed and is being processed.</p>

    <!-- Status Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:${BRAND};color:${GOLD};padding:6px 18px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:1px;">
          ${data.status}
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#888;margin:0 0 4px 0;">Order ID</p>
    <p style="font-size:16px;color:#333;margin:0 0 20px 0;font-weight:700;">${data.orderId}</p>

    <!-- Items Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background-color:${BRAND};">
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:${GOLD};font-weight:600;">Item</th>
          <th style="padding:10px 12px;text-align:center;font-size:13px;color:${GOLD};font-weight:600;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:13px;color:${GOLD};font-weight:600;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows(data.items)}
      </tbody>
      <tfoot>
        ${discountLine}
        <tr>
          <td colspan="2" style="padding:10px 12px;font-size:15px;font-weight:700;color:#333;">Total</td>
          <td style="padding:10px 12px;font-size:15px;font-weight:700;color:${BRAND};text-align:right;">EGP ${data.totalPrice.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Delivery Details -->
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee;">
      <p style="font-size:14px;color:#333;margin:0 0 10px 0;font-weight:700;">Delivery Details</p>
      <p style="font-size:13px;color:#666;margin:0 0 2px 0;">${data.address}${data.apartment ? `, Apt ${data.apartment}` : ''}</p>
      <p style="font-size:13px;color:#666;margin:0 0 2px 0;">${data.city}${data.governorate ? `, ${data.governorate}` : ''}</p>
      <p style="font-size:13px;color:#666;margin:0 0 2px 0;">Phone: ${data.phoneNumber}</p>
      ${data.paymentMethod ? `<p style="font-size:13px;color:#666;margin:0;">Payment: ${data.paymentMethod}</p>` : ''}
    </div>

    <!-- WhatsApp CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td style="background-color:#25D366;border-radius:6px;text-align:center;">
          <a href="https://wa.me/201044415982?text=Hi!%20I%20have%20a%20question%20about%20order%20${data.orderId}"
             style="display:inline-block;padding:12px 24px;font-size:14px;color:#fff;text-decoration:none;font-weight:600;">
            Chat on WhatsApp
          </a>
        </td>
      </tr>
    </table>
    <p style="font-size:12px;color:#999;margin:6px 0 0 0;">Have questions? We're here to help.</p>
  `;

  return baseHtml(content);
}

export function orderStatusHtml(data: OrderEmailData): string {
  const discountLine = data.discountAmount && data.discountAmount > 0
    ? `<tr><td style="padding:8px 12px;font-size:14px;color:#999;">Discount${data.discountCode ? ` (${data.discountCode})` : ''}</td><td style="padding:8px 12px;font-size:14px;color:#e74c3c;text-align:right;">-EGP ${data.discountAmount.toFixed(2)}</td></tr>`
    : '';

  const statusLabel = data.status === 'CONFIRMED' ? 'has been confirmed'
    : data.status === 'SHIPPED' ? 'is on its way'
    : data.status === 'DELIVERED' ? 'has been delivered'
    : `is now ${data.status}`;

  const content = `
    <p style="margin:0 0 20px 0;font-size:16px;color:#333;">Hi <strong>${data.customerName}</strong>,</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#666;">Your order <strong>${statusLabel}</strong>.</p>

    <!-- Status Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:${BRAND};color:${GOLD};padding:6px 18px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:1px;">
          ${data.status}
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#888;margin:0 0 4px 0;">Order ID</p>
    <p style="font-size:16px;color:#333;margin:0 0 20px 0;font-weight:700;">${data.orderId}</p>

    <!-- Items Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background-color:${BRAND};">
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:${GOLD};font-weight:600;">Item</th>
          <th style="padding:10px 12px;text-align:center;font-size:13px;color:${GOLD};font-weight:600;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:13px;color:${GOLD};font-weight:600;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows(data.items)}
      </tbody>
      <tfoot>
        ${discountLine}
        <tr>
          <td colspan="2" style="padding:10px 12px;font-size:15px;font-weight:700;color:#333;">Total</td>
          <td style="padding:10px 12px;font-size:15px;font-weight:700;color:${BRAND};text-align:right;">EGP ${data.totalPrice.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Delivery Details -->
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee;">
      <p style="font-size:14px;color:#333;margin:0 0 10px 0;font-weight:700;">Delivery Details</p>
      <p style="font-size:13px;color:#666;margin:0 0 2px 0;">${data.address}${data.apartment ? `, Apt ${data.apartment}` : ''}</p>
      <p style="font-size:13px;color:#666;margin:0 0 2px 0;">${data.city}${data.governorate ? `, ${data.governorate}` : ''}</p>
      <p style="font-size:13px;color:#666;margin:0 0 2px 0;">Phone: ${data.phoneNumber}</p>
      ${data.paymentMethod ? `<p style="font-size:13px;color:#666;margin:0;">Payment: ${data.paymentMethod}</p>` : ''}
    </div>

    <!-- WhatsApp CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td style="background-color:#25D366;border-radius:6px;text-align:center;">
          <a href="https://wa.me/201044415982?text=Hi!%20I%20have%20a%20question%20about%20order%20${data.orderId}"
             style="display:inline-block;padding:12px 24px;font-size:14px;color:#fff;text-decoration:none;font-weight:600;">
            Chat on WhatsApp
          </a>
        </td>
      </tr>
    </table>
    <p style="font-size:12px;color:#999;margin:6px 0 0 0;">Have questions? We're here to help.</p>
  `;

  return baseHtml(content);
}

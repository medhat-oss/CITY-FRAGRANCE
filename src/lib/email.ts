import { getCloudflareContext } from "@opennextjs/cloudflare";
import { orderConfirmationHtml, orderStatusHtml, type OrderEmailData } from "./email-templates";

const FROM_EMAIL = "orders@cityfragrance.com";
const FROM_NAME = "City Fragrance";

export async function sendOrderConfirmation(data: OrderEmailData): Promise<string | null> {
  if (!data.email) return null;
  const html = orderConfirmationHtml(data);
  const text = `Order ${data.orderId} confirmed. Total: EGP ${data.totalPrice.toFixed(2)}. Thank you for your order!`;

  return sendEmail({
    to: data.email,
    subject: `Order Confirmed – City Fragrance #${data.orderId}`,
    html,
    text,
  });
}

export async function sendOrderStatusUpdate(data: OrderEmailData): Promise<string | null> {
  if (!data.email) return null;
  const html = orderStatusHtml(data);
  const text = `Order ${data.orderId} update: ${data.status}.`;

  const statusLabel = data.status === 'CONFIRMED' ? 'Confirmed'
    : data.status === 'SHIPPED' ? 'Shipped'
    : data.status === 'DELIVERED' ? 'Delivered'
    : data.status;

  return sendEmail({
    to: data.email,
    subject: `Order ${statusLabel} – City Fragrance #${data.orderId}`,
    html,
    text,
  });
}

async function sendEmail({
  to, subject, html, text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<string | null> {
  if (!to) return null;

  try {
    const { env } = getCloudflareContext();
    const response = await (env as any).EMAIL.send({
      to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      html,
      text,
    });
    return response.messageId as string;
  } catch (err) {
    console.error('EMAIL SEND ERROR (non-blocking):', (err as Error)?.message || err);
    return null;
  }
}

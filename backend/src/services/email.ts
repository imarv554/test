import nodemailer from "nodemailer";

const required = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

export async function sendVendorOnboardEmail(to: string, vendorName: string, businessName: string) {
  const host = required("SMTP_HOST", process.env.SMTP_HOST);
  const port = Number(process.env.SMTP_PORT || 587);
  const user = required("SMTP_USER", process.env.SMTP_USER);
  const pass = required("SMTP_PASS", process.env.SMTP_PASS);
  const from = process.env.SMTP_FROM || `Credify <no-reply@credify.local>`;
  const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5173";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const loginUrl = `${appBaseUrl}/vendor-login`;

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif; line-height:1.6; color:#0f172a">
    <h2>Welcome to Credify, ${vendorName}!</h2>
    <p>Your vendor account for <strong>${businessName}</strong> has been successfully onboarded.</p>
    <p>You can access your vendor dashboard anytime:</p>
    <p>
      <a href="${loginUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Go to Vendor Login</a>
    </p>
    <p>Steps to get started:</p>
    <ol>
      <li>Visit <a href="${loginUrl}">${loginUrl}</a></li>
      <li>Sign in with your registered email address</li>
      <li>Start adding products and managing your orders</li>
    </ol>
    <p>If you did not request this, please ignore this email.</p>
    <hr/>
    <p style="font-size:12px;color:#475569">This message was sent automatically by Credify.</p>
  </div>`;

  await transporter.sendMail({
    from,
    to,
    subject: "You're onboarded on Credify — Vendor access",
    html,
  });
}

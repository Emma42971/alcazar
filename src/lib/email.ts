import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com"
const PORTAL = process.env.NEXTAUTH_URL ?? "https://example.com"

function baseTemplate(content: string, title: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>
  body { margin:0; padding:0; font-family: Inter, -apple-system, sans-serif; background:#F8FAFC; color:#0F172A; }
  .wrap { max-width:560px; margin:0 auto; padding:40px 20px; }
  .card { background:#fff; border:1px solid #E2E8F0; border-radius:12px; overflow:hidden; }
  .header { background:#1e3a8a; padding:28px 32px; }
  .header h1 { margin:0; color:#fff; font-size:20px; font-weight:600; }
  .header p { margin:6px 0 0; color:#93c5fd; font-size:13px; }
  .body { padding:28px 32px; }
  .body p { margin:0 0 16px; font-size:14px; line-height:1.6; color:#334155; }
  .btn { display:inline-block; background:#2563EB; color:#fff !important; text-decoration:none; padding:11px 24px; border-radius:7px; font-size:14px; font-weight:600; margin:8px 0 16px; }
  .divider { height:1px; background:#E2E8F0; margin:20px 0; }
  .footer { padding:16px 32px; background:#F8FAFC; border-top:1px solid #E2E8F0; }
  .footer p { margin:0; font-size:12px; color:#94A3B8; }
  .highlight { background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:14px 16px; margin:16px 0; }
  .highlight p { margin:0; font-size:13px; color:#1e40af; }
</style></head><body>
<div class="wrap">
  <div class="card">
    <div class="header"><h1>${title}</h1><p>Alcazar Investor Portal</p></div>
    <div class="body">${content}</div>
    <div class="footer"><p>© ${new Date().getFullYear()} Alcazar Capital · <a href="${PORTAL}" style="color:#94A3B8">${PORTAL}</a></p></div>
  </div>
</div></body></html>`
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  const content = `
    <p>Hi ${firstName},</p>
    <p>Thank you for registering on the Alcazar Investor Portal. Your account is currently under review.</p>
    <p>You will receive an email once your account has been approved by our team, typically within 1–2 business days.</p>
    <div class="highlight"><p>💡 Make sure to check your spam folder if you don't hear back from us.</p></div>
    <p>If you have any questions, please don't hesitate to reach out.</p>
    <p>Best regards,<br><strong>The Alcazar Team</strong></p>`
  await resend.emails.send({ from: FROM, to, subject: "Your registration is under review — Alcazar Capital", html: baseTemplate(content, "Welcome to Alcazar") })
}

export async function sendApprovalEmail(to: string, firstName: string) {
  const content = `
    <p>Hi ${firstName},</p>
    <p>Great news — your investor account has been approved. You can now access the portal.</p>
    <a href="${PORTAL}" class="btn">Access Investor Portal →</a>
    <div class="divider"></div>
    <p>Your login credentials remain the same as when you registered.</p>
    <p>Best regards,<br><strong>The Alcazar Team</strong></p>`
  await resend.emails.send({ from: FROM, to, subject: "Your account has been approved — Alcazar Capital", html: baseTemplate(content, "Account Approved") })
}

export async function sendNdaApprovedEmail(to: string, firstName: string, projectName: string, pdfUrl?: string) {
  const content = `
    <p>Hi ${firstName},</p>
    <p>Your NDA for <strong>${projectName}</strong> has been approved. You now have full access to the project's data room.</p>
    <a href="${PORTAL}/dashboard" class="btn">Access Data Room →</a>
    ${pdfUrl ? `<div class="highlight"><p>📄 <a href="${pdfUrl}" style="color:#1e40af">Download your signed NDA</a></p></div>` : ""}
    <p>Best regards,<br><strong>The Alcazar Team</strong></p>`
  await resend.emails.send({ from: FROM, to, subject: `NDA approved — ${projectName}`, html: baseTemplate(content, "Data Room Access Granted") })
}

export async function sendQaAnswerEmail(to: string, firstName: string, projectName: string, question: string, answer: string) {
  const content = `
    <p>Hi ${firstName},</p>
    <p>Your question about <strong>${projectName}</strong> has been answered:</p>
    <div class="highlight">
      <p><strong>Q:</strong> ${question}</p>
    </div>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#166534;"><strong>A:</strong> ${answer}</p>
    </div>
    <a href="${PORTAL}/dashboard" class="btn">View in Portal →</a>
    <p>Best regards,<br><strong>The Alcazar Team</strong></p>`
  await resend.emails.send({ from: FROM, to, subject: `Q&A response — ${projectName}`, html: baseTemplate(content, "Your Question Was Answered") })
}

export async function sendAdminNewInvestorEmail(adminEmail: string, investorEmail: string, investorName: string) {
  const content = `
    <p>A new investor has registered on the portal and is awaiting approval.</p>
    <div class="highlight">
      <p><strong>Name:</strong> ${investorName}<br><strong>Email:</strong> ${investorEmail}</p>
    </div>
    <a href="${PORTAL}/admin/investors" class="btn">Review in Admin Panel →</a>`
  await resend.emails.send({ from: FROM, to: adminEmail, subject: `New investor registration — ${investorName}`, html: baseTemplate(content, "New Investor Registration") })
}

export async function sendAdminNdaSubmittedEmail(adminEmail: string, investorName: string, projectName: string) {
  const content = `
    <p>An investor has submitted an NDA and is awaiting your review.</p>
    <div class="highlight">
      <p><strong>Investor:</strong> ${investorName}<br><strong>Project:</strong> ${projectName}</p>
    </div>
    <a href="${PORTAL}/admin/ndas" class="btn">Review NDA →</a>`
  await resend.emails.send({ from: FROM, to: adminEmail, subject: `NDA submitted — ${investorName} / ${projectName}`, html: baseTemplate(content, "NDA Submitted for Review") })
}

export async function sendNewDocumentEmail(to: string, firstName: string, projectName: string, docName: string) {
  const content = `
    <p>Hi ${firstName},</p>
    <p>A new document has been published in the <strong>${projectName}</strong> data room:</p>
    <div class="highlight"><p>📄 <strong>${docName}</strong></p></div>
    <a href="${PORTAL}/dashboard" class="btn">View in Data Room →</a>
    <p>Best regards,<br><strong>The Alcazar Team</strong></p>`
  await resend.emails.send({ from: FROM, to, subject: `New document available — ${projectName}`, html: baseTemplate(content, "New Document Available") })
}

// Generic sendEmail dispatcher — backward compat
export async function sendEmail(opts: {
  type: string
  email?: string
  token?: string
  code?: string
  name?: string
  project?: string
  message?: string
  ticket?: string
  investorName?: string
  docName?: string
  projectName?: string
}) {
  const to = opts.email ?? ""
  try {
    if (opts.type === "reset-password" && opts.token) {
      const link = `${PORTAL}/auth/reset-password?token=${opts.token}`
      const content = `<p>Click the link below to reset your password:</p><a href="${link}" class="btn">Reset Password →</a><p>This link expires in 1 hour.</p>`
      await resend.emails.send({ from: FROM, to, subject: "Reset your password — Alcazar Capital", html: baseTemplate(content, "Password Reset") })
    } else if (opts.type === "otp-code" && opts.code) {
      const content = `<p>Your verification code is:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:20px 0;color:hsl(152 57% 38%)">${opts.code}</div><p>This code expires in 10 minutes.</p>`
      await resend.emails.send({ from: FROM, to, subject: "Your verification code — Alcazar Capital", html: baseTemplate(content, "Verification Code") })
    } else if (opts.type === "new-inquiry") {
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        const c = `<p>New inquiry from <strong>${opts.name}</strong> (${to})${opts.project ? ` about <strong>${opts.project}</strong>` : ""}.</p>${opts.message ? `<div class="highlight"><p>${opts.message}</p></div>` : ""}<a href="${PORTAL}/admin/inquiries" class="btn">View Inquiries →</a>`
        await resend.emails.send({ from: FROM, to: adminEmail, subject: "New investor inquiry", html: baseTemplate(c, "New Inquiry") })
      }
    } else if (opts.type === "first-document-open") {
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        const c = `<p><strong>${opts.investorName}</strong> just opened <strong>${opts.docName}</strong> in the <strong>${opts.projectName}</strong> data room for the first time.</p><a href="${PORTAL}/admin/analytics" class="btn">View Analytics →</a>`
        await resend.emails.send({ from: FROM, to: adminEmail, subject: `Document opened — ${opts.investorName}`, html: baseTemplate(c, "Document Activity") })
      }
    }
  } catch(e) {
    console.error("sendEmail error:", e)
  }
}

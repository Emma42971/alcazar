import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM_EMAIL ?? "portal@alcazar.com"
const ADMIN  = process.env.ADMIN_EMAIL       ?? "admin@alcazar.com"
const URL    = process.env.NEXTAUTH_URL       ?? "https://localhost:3000"

type EmailType =
  | { type: "investor-registered"; name: string; email: string }
  | { type: "investor-approved";   name: string; email: string }
  | { type: "nda-signed";          name: string; email: string; project: string }
  | { type: "nda-approved";        name: string; email: string; project: string }
  | { type: "reset-password";      email: string; token: string }
  | { type: "new-inquiry";         name: string; email: string; project: string; message?: string; ticket?: string }
  | { type: "otp-code";            email: string; code: string }
  | { type: "first-document-open"; investorName: string; docName: string; projectName: string }

export async function sendEmail(payload: EmailType): Promise<void> {
  try {
    const btn = (href: string, label: string) =>
      `<a href="${href}" style="background:#000;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px;font-weight:500">${label}</a>`

    const { to, subject, html } = (() => {
      switch (payload.type) {
        case "investor-registered":
          return {
            to: ADMIN, subject: `New registration — ${payload.name}`,
            html: `<h2>New investor registration</h2><p><strong>${payload.name}</strong> (${payload.email}) has requested access.</p>${btn(`${URL}/admin/investors`, "Review in Admin")}`,
          }
        case "investor-approved":
          return {
            to: payload.email, subject: "Your access has been approved",
            html: `<h2>Welcome, ${payload.name}</h2><p>Your account has been <strong>approved</strong>. You can now sign in.</p>${btn(URL, "Access Portal")}`,
          }
        case "nda-signed":
          return {
            to: ADMIN, subject: `NDA signed — ${payload.name} — ${payload.project}`,
            html: `<h2>NDA signed — awaiting approval</h2><p><strong>${payload.name}</strong> (${payload.email}) signed the NDA for <strong>${payload.project}</strong>.</p>${btn(`${URL}/admin/ndas`, "Review NDA")}`,
          }
        case "nda-approved":
          return {
            to: payload.email, subject: `NDA approved — ${payload.project}`,
            html: `<h2>NDA approved</h2><p>Your NDA for <strong>${payload.project}</strong> has been approved. You now have full access to the data room.</p>${btn(`${URL}/dashboard`, "Access Data Room")}`,
          }
        case "reset-password":
          return {
            to: payload.email, subject: "Reset your password",
            html: `<h2>Password reset</h2><p>Click below to set a new password. Expires in 1 hour.</p>${btn(`${URL}/auth/reset-password?token=${payload.token}`, "Reset Password")}<p style="color:#999;font-size:12px;margin-top:16px">If you didn't request this, ignore this email.</p>`,
          }
        case "new-inquiry":
          return {
            to: ADMIN, subject: `New inquiry — ${payload.name}`,
            html: `<h2>New inquiry</h2><p><strong>${payload.name}</strong> (${payload.email}) — ${payload.project}</p>${payload.ticket ? `<p><strong>Ticket:</strong> ${payload.ticket}</p>` : ""}${payload.message ? `<blockquote style="border-left:3px solid #000;padding:8px 16px;background:#f5f5f5">${payload.message}</blockquote>` : ""}${btn(`${URL}/admin/inquiries`, "View in Admin")}`,
          }
        case "otp-code":
          return {
            to: payload.email, subject: `Your verification code — ${payload.code}`,
            html: `<h2>Verification code</h2><div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f5f5f5;border-radius:8px;text-align:center;margin:16px 0">${payload.code}</div><p style="color:#999;font-size:12px">Expires in 10 minutes.</p>`,
          }
        case "first-document-open":
          return {
            to: ADMIN,
            subject: `${payload.investorName} just opened ${payload.docName} for the first time`,
            html: `<h2>First document view</h2><p><strong>${payload.investorName}</strong> just opened <strong>${payload.docName}</strong> for the first time on <strong>${payload.projectName}</strong>.</p>`,
          }
      }
    })()

    await resend.emails.send({ from: FROM, to: [to], subject, html })
  } catch (err) {
    console.error("[email] Failed:", payload.type, err)
  }
}

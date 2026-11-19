import fs from 'node:fs';
import nodemailer from 'nodemailer';

let transport;
export const mailEnabled = () => !!(process.env.MAIL_OUTBOX || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS));

export async function sendMail({ to, subject, body }) {
  if (process.env.MAIL_OUTBOX) return fs.appendFileSync(process.env.MAIL_OUTBOX, JSON.stringify({ to, subject, body }) + '\n');
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport.sendMail({ from: process.env.MAIL_FROM || `Giftory <${process.env.SMTP_USER}>`, to, subject, text: body });
}

const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

let smtpTransporter = null;
let sendgridReady = false;

function initSendGrid() {
  if (sendgridReady) return;
  const key = process.env.SENDGRID_API_KEY;
  if (key) {
    sgMail.setApiKey(key);
    sendgridReady = true;
  }
}

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;
  if (MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASS) {
    smtpTransporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: Number(MAIL_PORT),
      secure: Number(MAIL_PORT) === 465,
      auth: { user: MAIL_USER, pass: MAIL_PASS }
    });
  } else {
    // Fallback: JSON transport (logs emails to console)
    smtpTransporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return smtpTransporter;
}

async function safeSend(options) {
  const from = process.env.MAIL_FROM || 'no-reply@example.com';
  const msg = { from, ...options };

  try {
    // 1) Prefer SendGrid in production (no SMTP ports needed)
    if (process.env.SENDGRID_API_KEY) {
      initSendGrid();
      const sgMsg = {
        to: msg.to,            // string or array
        from,                  // MUST be a verified sender in SendGrid
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        replyTo: msg.replyTo
      };
      const [resp] = await sgMail.send(sgMsg);
      console.log('[MAIL] SendGrid accepted:', Array.isArray(sgMsg.to) ? sgMsg.to.join(', ') : sgMsg.to, sgMsg.subject);
      return { provider: 'sendgrid', statusCode: resp?.statusCode || 202 };
    }

    // 2) Fallback to SMTP if configured
    const tx = await getSmtpTransporter().sendMail(msg);
    if (tx.message) {
      // jsonTransport result
      console.log('[MAIL] Simulated send (JSON transport):', msg.to, msg.subject);
    } else {
      console.log('[MAIL] SMTP sent:', msg.to, msg.subject);
    }
    return tx;
  } catch (err) {
    // Never block business flow due to email issues
    console.warn('[MAIL] Primary send failed:', err.message, '— falling back to JSON transport');
    try {
      const fallback = nodemailer.createTransport({ jsonTransport: true });
      const tx = await fallback.sendMail(msg);
      console.log('[MAIL] Simulated send (fallback):', msg.to, msg.subject);
      return tx;
    } catch (err2) {
      console.error('[MAIL] Fallback send failed:', err2.message, '— proceeding without email.');
      return { failed: true };
    }
  }
}

module.exports = { safeSend };
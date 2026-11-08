/**
 * SMTP transport factory with module-level caching.
 *
 * The transport is built lazily on first call and reused across invocations
 * on the same Cloud Functions instance, so the SMTP connection is kept alive
 * via the pool (maxConnections: 1, maxMessages: 50).
 *
 * Credentials are read from env vars populated by Secret Manager:
 *   GMAIL_USER          — sender address (e.g. user@hqe.it)
 *   GMAIL_APP_PASSWORD  — 16-char Google app password (no spaces)
 */

const nodemailer = require("nodemailer");

let cachedTransport = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
  });
  return cachedTransport;
}

module.exports = { getTransport };

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export type SendEmailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

/** The SMTP settings the environment describes, or null when it describes none. */
export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
};

/**
 * Reads the mail settings under every name the project documents.
 *
 * The root `.env.example` says `SMTP_FROM`; `apps/api/.env.example` and the
 * app config say `EMAIL_FROM`, with `EMAIL_PROVIDER=sendgrid` and
 * `SENDGRID_API_KEY` as an option. Only `SMTP_FROM` used to count, so an
 * operator following the API's own example got no verification or
 * password-reset email at all, and nothing said why. Either sender name now
 * works, SendGrid goes through its SMTP relay (user `apikey`, the key as the
 * password), the port defaults to 587, and `SMTP_SECURE` is honoured.
 */
export function resolveSmtpSettings(get: (key: string) => string | undefined): SmtpSettings | null {
  const from = get('SMTP_FROM') || get('EMAIL_FROM');
  const provider = (get('EMAIL_PROVIDER') || 'smtp').toLowerCase();
  const sendgridKey = get('SENDGRID_API_KEY');

  let host = get('SMTP_HOST');
  let user = get('SMTP_USER');
  let pass = get('SMTP_PASS');
  if (!host && provider === 'sendgrid' && sendgridKey) {
    host = 'smtp.sendgrid.net';
    user = 'apikey';
    pass = sendgridKey;
  }
  if (!host || !from) return null;

  const portRaw = get('SMTP_PORT');
  const parsed = portRaw ? parseInt(portRaw, 10) : NaN;
  const port = Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
  const secureRaw = get('SMTP_SECURE');
  const secure = secureRaw ? secureRaw === 'true' : port === 465;

  return { host, port, secure, auth: user && pass ? { user, pass } : undefined, from };
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from: string | null = null;

  constructor(private readonly config: ConfigService) {
    const settings = resolveSmtpSettings((key) => this.config.get<string>(key));
    if (settings) {
      this.transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth: settings.auth,
      });
      this.from = settings.from;
      this.logger.log(`Email is on: ${settings.host}:${settings.port}, from ${settings.from}`);
    } else {
      // Said once at start-up, not only per message: without mail, sign-up
      // verification and password-reset links exist only in this log.
      this.logger.warn(
        'Email is off: set SMTP_HOST and SMTP_FROM (or EMAIL_FROM), or EMAIL_PROVIDER=sendgrid with SENDGRID_API_KEY. ' +
          'Verification and password-reset links are written to this log instead.',
      );
    }
  }

  isEnabled(): boolean {
    return this.transporter !== null && this.from !== null;
  }

  async sendEmail(params: SendEmailParams): Promise<void> {
    if (!this.transporter || !this.from) return;
    await this.transporter.sendMail({
      from: this.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
  }
}

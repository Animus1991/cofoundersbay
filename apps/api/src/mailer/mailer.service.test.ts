import { describe, expect, it } from 'vitest';
import { resolveSmtpSettings } from './mailer.service';

const from = (env: Record<string, string>) => (key: string) => env[key];

describe('mail settings', () => {
  it('accepts the API example\'s EMAIL_FROM, not only SMTP_FROM (the API example sent no email at all)', () => {
    const settings = resolveSmtpSettings(from({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587', SMTP_USER: 'u', SMTP_PASS: 'p', EMAIL_FROM: 'noreply@cofounderbay.com' }));
    expect(settings).toMatchObject({ host: 'smtp.example.com', port: 587, secure: false, from: 'noreply@cofounderbay.com', auth: { user: 'u', pass: 'p' } });
  });

  it('prefers SMTP_FROM when both are set', () => {
    expect(resolveSmtpSettings(from({ SMTP_HOST: 'h', SMTP_FROM: 'a@x.co', EMAIL_FROM: 'b@x.co' }))?.from).toBe('a@x.co');
  });

  it('sends through SendGrid\'s SMTP relay when the provider is sendgrid', () => {
    const settings = resolveSmtpSettings(from({ EMAIL_PROVIDER: 'sendgrid', SENDGRID_API_KEY: 'SG.key', EMAIL_FROM: 'noreply@cofounderbay.com' }));
    expect(settings).toMatchObject({ host: 'smtp.sendgrid.net', port: 587, auth: { user: 'apikey', pass: 'SG.key' } });
  });

  it('defaults the port to 587, makes 465 implicit TLS, and honours SMTP_SECURE', () => {
    expect(resolveSmtpSettings(from({ SMTP_HOST: 'h', SMTP_FROM: 'a@x.co' }))?.port).toBe(587);
    expect(resolveSmtpSettings(from({ SMTP_HOST: 'h', SMTP_PORT: '465', SMTP_FROM: 'a@x.co' }))?.secure).toBe(true);
    expect(resolveSmtpSettings(from({ SMTP_HOST: 'h', SMTP_PORT: '2525', SMTP_SECURE: 'true', SMTP_FROM: 'a@x.co' }))?.secure).toBe(true);
  });

  it('is off without a host or a sender', () => {
    expect(resolveSmtpSettings(from({ SMTP_HOST: 'h' }))).toBeNull();
    expect(resolveSmtpSettings(from({ EMAIL_FROM: 'a@x.co' }))).toBeNull();
    expect(resolveSmtpSettings(from({ EMAIL_PROVIDER: 'sendgrid', EMAIL_FROM: 'a@x.co' }))).toBeNull();
  });
});

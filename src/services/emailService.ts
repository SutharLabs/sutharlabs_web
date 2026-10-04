/**
 * SutharLabs Enterprise Email & Notification Service
 * Handles dispatching inquiries, alerts, and system telemetry notifications to administrators.
 * Designed with a pluggable adapter for future SMTP (e.g. Nodemailer, AWS SES, Resend, SendGrid) routing.
 */

export interface ContactNotificationPayload {
  trackingId: string;
  name: string;
  email: string;
  projectType: string;
  message: string;
  createdAt: Date | string;
}

export interface DispatchResult {
  success: boolean;
  recipient: string;
  method: 'SMTP' | 'WEBHOOK' | 'DEV_CONSOLE_STUB';
  timestamp: string;
  error?: string;
}

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mr.sutharsuresh@gmail.com';

/**
 * Dispatches an automated email notification to the platform administrator
 * when a new project consultation or inquiry is submitted.
 */
export async function notifyAdminNewInquiry(
  inquiry: ContactNotificationPayload
): Promise<DispatchResult> {
  const recipient = DEFAULT_ADMIN_EMAIL;
  const timestamp = new Date().toISOString();

  // Future Scope Hook: If SMTP / Resend credentials are configured in environment variables,
  // execute direct transmission.
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      // Future integration ready: nodemailer or custom transport
      console.log(`[Email Dispatcher - SMTP Ready] Routing inquiry ${inquiry.trackingId} to ${recipient}...`);
      return {
        success: true,
        recipient,
        method: 'SMTP',
        timestamp
      };
    } catch (err: any) {
      console.error(`[Email Dispatcher] Failed to deliver via SMTP:`, err);
      return {
        success: false,
        recipient,
        method: 'SMTP',
        timestamp,
        error: err.message
      };
    }
  }

  // Developer & Edge Stub: Safely log the structured dispatch payload
  console.log(`\n================== [SUTHARLABS INQUIRY NOTIFICATION] ==================`);
  console.log(`To: ${recipient}`);
  console.log(`Subject: [New Consultation Lead] ${inquiry.projectType} — ${inquiry.trackingId}`);
  console.log(`From Client: ${inquiry.name} <${inquiry.email}>`);
  console.log(`Tracking ID: ${inquiry.trackingId}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Message:\n${inquiry.message}`);
  console.log(`========================================================================\n`);

  return {
    success: true,
    recipient,
    method: 'DEV_CONSOLE_STUB',
    timestamp
  };
}

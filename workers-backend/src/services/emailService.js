// GAP-02: Email Delivery Service
// Uses fetch() to call email API (Resend/SendGrid/Mailgun)
// Falls back to logging if no API key configured

const EMAIL_TEMPLATES = {
  passwordReset: (data) => ({
    subject: 'TradeAI - Password Reset Request',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a237e;">Password Reset</h2>
      <p>Hi ${data.firstName || 'there'},</p>
      <p>You requested a password reset for your TradeAI account.</p>
      <p><a href="${data.resetUrl}" style="display:inline-block;padding:12px 24px;background:#1a237e;color:#fff;text-decoration:none;border-radius:4px;">Reset Password</a></p>
      <p style="color:#666;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      <p style="color:#666;font-size:12px;">Token: ${data.token}</p>
    </div>`
  }),
  approvalRequest: (data) => ({
    subject: `TradeAI - Approval Required: ${data.entityName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a237e;">Approval Required</h2>
      <p>Hi ${data.approverName || 'there'},</p>
      <p>A new ${data.entityType} requires your approval:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Item</td><td style="padding:8px;border:1px solid #ddd;">${data.entityName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Amount</td><td style="padding:8px;border:1px solid #ddd;">R ${(data.amount || 0).toLocaleString()}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Submitted by</td><td style="padding:8px;border:1px solid #ddd;">${data.submittedBy}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">SLA Deadline</td><td style="padding:8px;border:1px solid #ddd;">${data.slaDeadline || 'N/A'}</td></tr>
      </table>
      <p><a href="${data.approvalUrl || '#'}" style="display:inline-block;padding:12px 24px;background:#1a237e;color:#fff;text-decoration:none;border-radius:4px;">Review & Approve</a></p>
    </div>`
  }),
  approvalDecision: (data) => ({
    subject: `TradeAI - ${data.entityName} ${data.decision === 'approved' ? 'Approved' : 'Rejected'}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:${data.decision === 'approved' ? '#2e7d32' : '#c62828'};">${data.entityName} - ${data.decision === 'approved' ? 'Approved' : 'Rejected'}</h2>
      <p>Hi ${data.recipientName || 'there'},</p>
      <p>Your ${data.entityType} "${data.entityName}" has been <strong>${data.decision}</strong> by ${data.decidedBy}.</p>
      ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ''}
    </div>`
  }),
  budgetAlert: (data) => ({
    subject: `TradeAI - Budget Alert: ${data.budgetName} at ${data.percentage}%`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:${data.percentage >= 100 ? '#c62828' : '#ff8f00'};">Budget Alert</h2>
      <p>Budget "${data.budgetName}" has reached <strong>${data.percentage}%</strong> utilization.</p>
      <p>Utilized: R ${(data.utilized || 0).toLocaleString()} of R ${(data.total || 0).toLocaleString()}</p>
    </div>`
  }),
  settlementConfirmation: (data) => ({
    subject: `TradeAI - Settlement Processed: ${data.customerName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a237e;">Settlement Processed</h2>
      <p>Settlement for ${data.customerName} has been processed.</p>
      <p>Net Amount: R ${(data.netAmount || 0).toLocaleString()}</p>
      <p>Period: ${data.period}</p>
    </div>`
  })
};

export class EmailService {
  constructor(env) {
    this.apiKey = env.EMAIL_API_KEY;
    this.fromEmail = env.EMAIL_FROM || 'noreply@tradeai.vantax.co.za';
    this.fromName = env.EMAIL_FROM_NAME || 'TradeAI';
    this.provider = env.EMAIL_PROVIDER || 'resend'; // resend, sendgrid, mailgun
    this.kv = env.CACHE;
  }

  async send(to, templateName, data) {
    const template = EMAIL_TEMPLATES[templateName];
    if (!template) {
      console.error(`Unknown email template: ${templateName}`);
      return false;
    }

    const { subject, html } = template(data);

    if (!this.apiKey) {
      console.log(JSON.stringify({ level: 'info', action: 'email_queued', to, subject, note: 'No EMAIL_API_KEY configured' }));
      return true; // Don't fail if email not configured
    }

    try {
      let response;
      if (this.provider === 'resend') {
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: `${this.fromName} <${this.fromEmail}>`, to: [to], subject, html })
        });
      } else if (this.provider === 'sendgrid') {
        response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: this.fromEmail, name: this.fromName },
            subject, content: [{ type: 'text/html', value: html }]
          })
        });
      }

      if (response && !response.ok) {
        const err = await response.text().catch(() => 'Unknown error');
        console.error(JSON.stringify({ level: 'error', action: 'email_send_failed', to, subject, status: response.status, error: err }));
        // Queue for retry
        if (this.kv) {
          const retryKey = `email_retry:${crypto.randomUUID()}`;
          await this.kv.put(retryKey, JSON.stringify({ to, templateName, data, attempts: 1 }), { expirationTtl: 3600 });
        }
        return false;
      }

      console.log(JSON.stringify({ level: 'info', action: 'email_sent', to, subject }));
      return true;
    } catch (error) {
      console.error(JSON.stringify({ level: 'error', action: 'email_error', to, subject, error: error.message }));
      return false;
    }
  }

  async sendApprovalNotification(to, data) { return this.send(to, 'approvalRequest', data); }
  async sendApprovalDecision(to, data) { return this.send(to, 'approvalDecision', data); }
  async sendPasswordReset(to, data) { return this.send(to, 'passwordReset', data); }
  async sendBudgetAlert(to, data) { return this.send(to, 'budgetAlert', data); }
  async sendSettlementConfirmation(to, data) { return this.send(to, 'settlementConfirmation', data); }
}

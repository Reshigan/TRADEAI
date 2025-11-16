const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.provider = config.email.provider;

    if (this.provider === 'sendgrid') {
      sgMail.setApiKey(config.email.sendgrid.apiKey);
    } else {
      // SMTP transporter
      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass
        }
      });
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      // Skip email sending in mock mode
      const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'mock';
      if (USE_MOCK_DB) {
        logger.info(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
        return { success: true, messageId: `mock-${Date.now()}` };
      }

      if (this.provider === 'sendgrid') {
        const msg = {
          to,
          from: config.email.from,
          subject,
          text: text || subject,
          html
        };

        await sgMail.send(msg);
      } else {
        const mailOptions = {
          from: config.email.from,
          to,
          subject,
          text: text || subject,
          html
        };

        await this.transporter.sendMail(mailOptions);
      }

      logger.info('Email sent successfully', { to, subject });
      return true;
    } catch (error) {
      logger.error('Email sending failed', { error, to, subject });
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to FMCG Trade Spend Management';
    const html = `
      <h1>Welcome ${user.firstName}!</h1>
      <p>Your account has been successfully created.</p>
      <p>You can now log in with your email: ${user.email}</p>
      <p>Your role: ${user.role}</p>
      <p>If you have any questions, please contact your administrator.</p>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, resetUrl) {
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset</h1>
      <p>Hi ${user.firstName},</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 30 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendApprovalRequestEmail(approver, item, type) {
    const subject = `Approval Required: ${type}`;
    const html = `
      <h1>Approval Required</h1>
      <p>Hi ${approver.firstName},</p>
      <p>A new ${type} requires your approval:</p>
      <ul>
        <li>ID: ${item.id}</li>
        <li>Name: ${item.name}</li>
        <li>Amount: ${item.amount}</li>
        <li>Requested by: ${item.requestedBy}</li>
      </ul>
      <p>Please log in to the system to review and approve.</p>
    `;

    return await this.sendEmail(approver.email, subject, html);
  }

  async sendApprovalNotificationEmail(user, item, type, status) {
    const subject = `${type} ${status}`;
    const html = `
      <h1>${type} ${status}</h1>
      <p>Hi ${user.firstName},</p>
      <p>Your ${type} has been ${status.toLowerCase()}:</p>
      <ul>
        <li>ID: ${item.id}</li>
        <li>Name: ${item.name}</li>
        <li>Amount: ${item.amount}</li>
        ${status === 'Rejected' ? `<li>Reason: ${item.rejectionReason}</li>` : ''}
      </ul>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendPromotionAlertEmail(users, promotion) {
    const subject = `New Promotion: ${promotion.name}`;
    const html = `
      <h1>New Promotion Alert</h1>
      <p>A new promotion has been created:</p>
      <ul>
        <li>Name: ${promotion.name}</li>
        <li>Type: ${promotion.promotionType}</li>
        <li>Start Date: ${promotion.period.startDate}</li>
        <li>End Date: ${promotion.period.endDate}</li>
        <li>Discount: ${promotion.mechanics.discountValue}%</li>
      </ul>
      <p>Please log in to view full details.</p>
    `;

    const promises = users.map((user) => this.sendEmail(user.email, subject, html));
    return await Promise.all(promises);
  }

  async sendBudgetAlertEmail(user, budget, alertType) {
    const subject = `Budget Alert: ${alertType}`;
    const html = `
      <h1>Budget Alert</h1>
      <p>Hi ${user.firstName},</p>
      <p>Budget alert for ${budget.name}:</p>
      <ul>
        <li>Alert Type: ${alertType}</li>
        <li>Budget: $${budget.total}</li>
        <li>Spent: $${budget.spent}</li>
        <li>Remaining: $${budget.remaining}</li>
        <li>Utilization: ${budget.utilization}%</li>
      </ul>
      <p>Please review and take necessary action.</p>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendReportEmail(user, report, attachmentPath = null) {
    const subject = `Report: ${report.name}`;
    const html = `
      <h1>Report Generated</h1>
      <p>Hi ${user.firstName},</p>
      <p>Your requested report has been generated:</p>
      <ul>
        <li>Report: ${report.name}</li>
        <li>Period: ${report.period}</li>
        <li>Generated: ${new Date().toLocaleString()}</li>
      </ul>
      ${attachmentPath ? '<p>The report is attached to this email.</p>' : '<p>Please log in to download the report.</p>'}
    `;

    if (this.provider === 'sendgrid' && attachmentPath) {
      // Handle SendGrid attachment
      const fs = require('fs');
      const attachment = fs.readFileSync(attachmentPath).toString('base64');

      const msg = {
        to: user.email,
        from: config.email.from,
        subject,
        html,
        attachments: [{
          content: attachment,
          filename: `${report.name}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }]
      };

      return await sgMail.send(msg);
    } else {
      return await this.sendEmail(user.email, subject, html);
    }
  }
}

module.exports = new EmailService();

const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.firstName = user.name.split(' ')[0];
    this.to = user.email;
    this.from = `Naterous App <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }

  newTransporter() {
    if (process.env.NODE_ENV === 'production') {
      // Gmail Implementation
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_PRODUCTION_USERNAME,
          pass: process.env.EMAIL_PRODUCTION_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );

    // 2) Mail Options Object
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: htmlToText.convert(html)
    };

    // 3) Send Email from transporter
    await this.newTransporter().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendResetPassword() {
    await this.send('resetPassword', 'Reset password');
  }
};

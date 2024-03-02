import { settings } from "./settings.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport(
  settings.email.smtp_url || {
    pool: true,
    service: settings.email.smtp_service,
    auth: {
      user: settings.email.smtp_user,
      pass: settings.email.smtp_pass,
    },
  }
);

transporter.verify(function (error) {
  if (error) {
    console.log("SMTP config error", error);
  } else {
    console.log("SMTP Server is ready");
  }
});

function sendAlert(subject, text) {
  transporter.sendMail({
    to: settings.email.from,
    bcc: null,
    from: {
      name: settings.email.alert_from_name,
      address: settings.email.alert_from_address,
    },
    reply_to: null,
    subject,
    text,
  });
}

export { transporter, sendAlert };

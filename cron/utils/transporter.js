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

export { transporter };

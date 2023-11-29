import { transporter } from "../utils/transporter.js";
import { database } from "../utils/database.js";
import { settings } from "./settings.js";
import { ofetch } from "ofetch";
import dayjs from "dayjs";

export const functions = {
  createMonthlyRevenu: async () => {
    const beginningOfMonth = dayjs().startOf("month").toDate();
    console.log(
      `[Cron task] createMonthlyRevenu starting for date ${beginningOfMonth}`
    );
    try {
      const users = await database.select("id").from("Users");
      for (let user of users) {
        await database("Revenus").insert({
          createdAt: beginningOfMonth,
          updatedAt: beginningOfMonth,
          UserId: +user.id,
        });
      }
      console.log(
        `[Cron task] createMonthlyRevenu finished successfully for date ${beginningOfMonth}`
      );
    } catch (err) {
      console.log(
        `[Cron task] createMonthlyRevenu An error occured for date ${beginningOfMonth}`
      );
      throw new Error(err);
    }
  },
  createCustomerRecurrentInvoice: async () => {
    try {
      console.log(`[Cron task] createCustomerRecurrentInvoice starting`);
      const lastRecurrentInvoices = await database
        .select("*")
        .from("Invoices")
        .where("recurrent", true)
        .whereIn(["CustomerId", "createdAt"], function () {
          this.select("CustomerId")
            .max("createdAt ")
            .from("Invoices")
            .where("recurrent", true)
            .groupBy("CustomerId");
        });

      if (lastRecurrentInvoices.length) {
        console.log(
          `[Cron task] createCustomerRecurrentInvoice Found ${lastRecurrentInvoices.length} recurrent invoices to create`
        );
      }

      for (let recurrentInvoice of lastRecurrentInvoices) {
        // TODO: return result of this insert
        const [invoice] = await database("Invoices")
          .insert({
            createdAt: dayjs().toDate(),
            updatedAt: dayjs().toDate(),
            firstName: recurrentInvoice.firstName,
            lastName: recurrentInvoice.lastName,
            company: recurrentInvoice.company,
            address: recurrentInvoice.address,
            city: recurrentInvoice.city,
            paymentDate: recurrentInvoice.paymentDate,
            total: recurrentInvoice.total,
            totalDue: recurrentInvoice.totalDue,
            totalTTC: recurrentInvoice.totalTTC,
            tvaAmount: recurrentInvoice.tvaAmount,
            tvaApplicable: recurrentInvoice.tvaApplicable,
            paid: recurrentInvoice.paid,
            recurrent: recurrentInvoice.recurrent,
            CustomerId: +recurrentInvoice.CustomerId,
          })
          .returning("id");

        const invoiceItems = await database
          .select("name", "unit", "quantity", "total")
          .from("InvoiceItems")
          .where("InvoiceId", recurrentInvoice.id);

        for (let invoiceItem of invoiceItems) {
          await database("InvoiceItems").insert({
            ...invoiceItem,
            createdAt: dayjs().toDate(),
            updatedAt: dayjs().toDate(),
            InvoiceId: invoice.id,
          });
        }
        console.log(
          `[Cron task] createCustomerRecurrentInvoice finished successfully`
        );
      }
    } catch (err) {
      console.log(
        `[Cron task] createCustomerRecurrentInvoice An error occured`
      );
      throw new Error(err);
    }
  },
  sendPendingEmail: async (pendingEmailId) => {
    try {
      const pending_email = await database
        .select("*")
        .from("PendingEmail")
        .where("id", pendingEmailId)
        .first();

      if (!pending_email) {
        throw new Error(`PendingEmail not found #${pendingEmailId}`);
      }

      let model;
      if (pending_email.InvoiceId) {
        model = await database
          .select("id", "uploadUrl")
          .from("Invoices")
          .where("id", pending_email.InvoiceId)
          .first();
      } else {
        model = await database
          .select("id", "uploadUrl")
          .from("Quotations")
          .where("id", pending_email.QuotationId)
          .first();
      }

      const data = await ofetch(model.uploadUrl, {
        method: "GET",
        headers: { "Content-Type": "application/pdf" },
      });

      const res = await transporter.sendMail({
        to: settings.email.replace || pending_email.recipientEmail,
        bcc: pending_email.bbcRecipientEmail
          ? pending_email.bbcRecipientEmail.split(",")
          : undefined,
        from: {
          name: pending_email.fromName,
          address: pending_email.fromAddress,
        },
        replyTo: {
          name: pending_email.fromName,
          address: pending_email.fromAddress,
        },
        subject: pending_email.subject,
        text: pending_email.content,
        attachments: [
          {
            filename: `mvm-${"cautionPaid" in model ? "devis" : "facture"}-${
              model.id
            }.pdf`,
            content: Buffer.from(await data.arrayBuffer()),
          },
        ],
      });

      if (res.accepted?.length) {
        console.log(
          `[Notifications Cron] Email sent to ${pending_email.recipientEmail}`
        );

        await database
          .from("PendingEmail")
          .where("id", pending_email.id)
          .update({ sent: true });
      }
    } catch (err) {
      console.error(
        `Failed to send message through smtp for pendingEmailId #${pendingEmailId}`
      );
      throw new Error("Transporter failed to send email " + err);
    }
  },
};

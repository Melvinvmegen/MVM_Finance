import { transporter } from "../utils/transporter.js";
import { database } from "../utils/database.js";
import { settings } from "./settings.js";
import { ofetch } from "ofetch";
import dayjs from "dayjs";

export const functions = {
  createMonthlyRevenu: async () => {
    const beginningOfMonth = dayjs().startOf("month").add(6, "hours").toDate();
    console.log(
      `[Cron task] createMonthlyRevenu starting for date ${beginningOfMonth}`
    );
    try {
      const users = await database.select("id").from("Users");
      for (let user of users) {
        await database("Revenus").insert({
          created_at: beginningOfMonth,
          updated_at: beginningOfMonth,
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
        .from(
          database.raw(
            `(SELECT "Invoices".id, "Invoices".*, "PendingEmail".*, "CronTask".*, ROW_NUMBER() OVER (PARTITION BY "Invoices"."CustomerId" ORDER BY "Invoices".created_at DESC) as rn 
            FROM "Invoices" 
            INNER JOIN "PendingEmail" ON "PendingEmail"."InvoiceId" = "Invoices"."id" 
            INNER JOIN "CronTask" ON "CronTask"."PendingEmailId" = "PendingEmail"."id"
            WHERE "Invoices".recurrent = true 
            GROUP BY "Invoices"."CustomerId", "Invoices".id, "PendingEmail".id, "CronTask".id
            ORDER BY "Invoices".created_at DESC) as "RankedInvoices"`
          )
        )
        .where("rn", 1);

      if (lastRecurrentInvoices.length) {
        console.log(
          `[Cron task] createCustomerRecurrentInvoice Found ${lastRecurrentInvoices.length} recurrent invoices to create`
        );
      }

      for (let recurrentInvoice of lastRecurrentInvoices) {
        const [invoice] = await database("Invoices")
          .insert({
            created_at: dayjs().toDate(),
            updated_at: dayjs().toDate(),
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
            vatNumber: recurrentInvoice.vatNumber,
          })
          .returning("id");

        const invoiceItems = await database
          .select("name", "unit", "quantity", "total")
          .from("InvoiceItems")
          .where("InvoiceId", recurrentInvoice.InvoiceId);

        const current_month = dayjs().format("MMMM");
        const current_month_capitalized =
          current_month[0].toUpperCase() +
          current_month.slice(1, current_month.length);
        const previous_month = dayjs().subtract(1, "month").format("MMMM");
        const previous_month_capitalized =
          previous_month[0].toUpperCase() +
          previous_month.slice(1, previous_month.length);

        console.log({ previous_month_capitalized, current_month_capitalized });

        for (let invoiceItem of invoiceItems) {
          await database("InvoiceItems").insert({
            ...invoiceItem,
            name: invoiceItem.name.replace(
              previous_month_capitalized,
              current_month_capitalized
            ),
            created_at: dayjs().toDate(),
            updated_at: dayjs().toDate(),
            InvoiceId: invoice.id,
          });
        }

        try {
          `[Cron task] createCustomerRecurrentInvoice generating pdf for invoice #${invoice.id}`;
          await ofetch(
            `${settings.finance.baseRequestsUrl}/invoices/generate-pdf`,
            {
              method: "POST",
              body: {
                id: invoice.id,
              },
              headers: {
                Authorization: `Basic ${btoa(
                  `${settings.finance.apiUsername}:${settings.finance.apiPassword}`
                )}`,
              },
            }
          );
          console.log(
            `[Cron task] Invoice's pdf successfully generated for #${invoice.id}`
          );
        } catch (err) {
          console.log(
            `[Cron task] An error occured while generating the pdf for invoice`,
            err
          );
          // TODO: send email to myself
        }

        const [pending_email] = await database("PendingEmail")
          .insert({
            created_at: new Date(),
            updated_at: new Date(),
            recipientEmail:
              settings.email.replace || recurrentInvoice.recipientEmail,
            fromAddress: settings.email.from,
            fromName: settings.email.from_name,
            bbcRecipientEmail: settings.email.bcc,
            // TODO handle year aswell
            subject: recurrentInvoice.subject.replace(
              previous_month_capitalized,
              current_month_capitalized
            ),
            // TODO handle year aswell
            content: recurrentInvoice.content.replace(
              previous_month,
              current_month
            ),
            sent: false,
            InvoiceId: invoice.id,
            UserId: recurrentInvoice.UserId,
          })
          .returning("id");

        await database("CronTask").insert({
          created_at: new Date(),
          updated_at: new Date(),
          date: dayjs(recurrentInvoice.date).add(1, "month").toDate(),
          dateIntervalType: recurrentInvoice.dateIntervalType,
          dateIntervalValue: recurrentInvoice.dateIntervalValue,
          active: true,
          function: recurrentInvoice.function,
          params: JSON.stringify({ PendingEmailId: pending_email.id }),
          errorMessage: null,
          tryCounts: 0,
          UserId: recurrentInvoice.UserId,
          PendingEmailId: pending_email.id,
        });
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

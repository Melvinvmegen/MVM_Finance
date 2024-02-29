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
      const users = await database.select("id").from("user");
      for (let user of users) {
        await database("revenu").insert({
          created_at: beginningOfMonth,
          updated_at: beginningOfMonth,
          user_id: +user.id,
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
      const last_recurrent_invoices = await database
        .select("*")
        .from(
          database.raw(
            `(SELECT invoice.id, invoice.*, pending_email.*, cron_task.*, ROW_NUMBER() OVER (PARTITION BY invoice.customer_id ORDER BY invoice.created_at DESC) as rn 
            FROM invoice 
            INNER JOIN pending_email ON pending_email.invoice_id = invoice.id 
            INNER JOIN cron_task ON cron_task.pending_email_id = pending_email.id
            WHERE invoice.recurrent = true 
            GROUP BY invoice.customer_id, invoice.id, pending_email.id, cron_task.id
            ORDER BY invoice.created_at DESC) as ranked_invoices`
          )
        )
        .where("rn", 1);

      if (last_recurrent_invoices.length) {
        console.log(
          `[Cron task] createCustomerRecurrentInvoice Found ${last_recurrent_invoices.length} recurrent invoices to create`
        );
      }

      for (let recurrent_invoice of last_recurrent_invoices) {
        const [invoice] = await database("invoice")
          .insert({
            created_at: dayjs().toDate(),
            updated_at: dayjs().toDate(),
            first_name: recurrent_invoice.first_name,
            last_name: recurrent_invoice.last_name,
            company: recurrent_invoice.company,
            address: recurrent_invoice.address,
            city: recurrent_invoice.city,
            payment_date: recurrent_invoice.payment_date,
            total: recurrent_invoice.total,
            total_due: recurrent_invoice.total_due,
            total_ttc: recurrent_invoice.total_ttc,
            tva_amount: recurrent_invoice.tva_amount,
            tva_applicable: recurrent_invoice.tva_applicable,
            paid: recurrent_invoice.paid,
            recurrent: recurrent_invoice.recurrent,
            customer_id: +recurrent_invoice.customer_id,
            vat_number: recurrent_invoice.vat_number,
          })
          .returning("id");

        const invoice_items = await database
          .select("name", "unit", "quantity", "total")
          .from("invoice_item")
          .where("invoice_id", recurrent_invoice.id);

        const current_month = dayjs().format("MMMM");
        const current_month_capitalized =
          current_month[0].toUpperCase() +
          current_month.slice(1, current_month.length);
        const previous_month = dayjs().subtract(1, "month").format("MMMM");
        const previous_month_capitalized =
          previous_month[0].toUpperCase() +
          previous_month.slice(1, previous_month.length);

        for (let invoice_item of invoice_items) {
          await database("invoice_item").insert({
            ...invoice_item,
            name: invoice_item.name.replace(
              previous_month_capitalized,
              current_month_capitalized
            ),
            created_at: dayjs().toDate(),
            updated_at: dayjs().toDate(),
            invoice_id: invoice.id,
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

        const [pending_email] = await database("pending_email")
          .insert({
            created_at: new Date(),
            updated_at: new Date(),
            recipient_email:
              settings.email.replace || recurrent_invoice.recipient_email,
            from_address: settings.email.from,
            from_name: settings.email.from_name,
            bbc_recipient_email: settings.email.bcc,
            // TODO handle year aswell
            subject: recurrent_invoice.subject.replace(
              previous_month_capitalized,
              current_month_capitalized
            ),
            // TODO handle year aswell
            content: recurrent_invoice.content.replace(
              previous_month,
              current_month
            ),
            sent: false,
            invoice_id: invoice.id,
            user_id: recurrent_invoice.user_id,
          })
          .returning("id");

        await database("cron_task").insert({
          created_at: new Date(),
          updated_at: new Date(),
          date: dayjs(recurrent_invoice.date).add(1, "month").toDate(),
          date_interval_type: recurrent_invoice.date_interval_type,
          date_interval_value: recurrent_invoice.date_interval_value,
          active: true,
          function: recurrent_invoice.function,
          params: JSON.stringify({ pending_email_id: pending_email.id }),
          error_message: null,
          try_cunts: 0,
          user_id: recurrent_invoice.user_id,
          pending_email_id: pending_email.id,
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
  sendPendingEmail: async (pending_email_id) => {
    try {
      const pending_email = await database
        .select("*")
        .from("pending_email")
        .where("id", pending_email_id)
        .first();

      if (!pending_email) {
        throw new Error(`PendingEmail not found #${pending_email_id}`);
      }

      let model;
      if (pending_email.invoice_id) {
        model = await database
          .select("id", "upload_url")
          .from("invoice")
          .where("id", pending_email.invoice_id)
          .first();
      } else {
        model = await database
          .select("id", "upload_url")
          .from("quotation")
          .where("id", pending_email.quotation_id)
          .first();
      }

      const data = await ofetch(model.upload_url, {
        method: "GET",
        headers: { "Content-Type": "application/pdf" },
      });

      const res = await transporter.sendMail({
        to: settings.email.replace || pending_email.recipient_email,
        bcc: pending_email.bbc_recipient_email
          ? pending_email.bbc_recipient_email.split(",")
          : undefined,
        from: {
          name: pending_email.from_name,
          address: pending_email.from_address,
        },
        reply_to: {
          name: pending_email.from_name,
          address: pending_email.from_address,
        },
        subject: pending_email.subject,
        text: pending_email.content,
        attachments: [
          {
            filename: `mvm-${"caution_paid" in model ? "devis" : "facture"}-${
              model.id
            }.pdf`,
            content: Buffer.from(await data.arrayBuffer()),
          },
        ],
      });

      if (res.accepted?.length) {
        console.log(
          `[Notifications Cron] Email sent to ${pending_email.recipient_email}`
        );

        await database
          .from("pending_email")
          .where("id", pending_email.id)
          .update({ sent: true });
      }
    } catch (err) {
      console.error(
        `Failed to send message through smtp for pending_email_id #${pending_email_id}`
      );
      throw new Error("Transporter failed to send email " + err);
    }
  },
};

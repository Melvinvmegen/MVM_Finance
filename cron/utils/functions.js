import { database } from "../utils/database.js";
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
};

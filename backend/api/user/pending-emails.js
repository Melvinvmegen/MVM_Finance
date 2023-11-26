import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { prisma, Models } from "../../utils/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { settings } from "../../utils/settings.js";
import dayjs from "dayjs";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/pending_emails/:id", getPendingEmail);
  app.$post("/pending_emails", createPendingEmail);
  app.$put("/pending_emails/:id", updatePendingEmail);
  app.$delete("/pending_emails/:id", deletePendingEmail);
}

/**
 * @this {API.This}
 * @param {number} pendingEmailId
 * @returns {Promise<Models.PendingEmail & { Invoices: Models.Invoices[], CronTask: Models.CronTask[] }>}
 */
export async function getPendingEmail(pendingEmailId) {
  const pending_email = await getOrSetCache(
    `user_${this.request.user?.id}_pending_email_${pendingEmailId}`,
    async () => {
      const pending_email = await prisma.pendingEmail.findFirst({
        where: {
          id: +pendingEmailId,
          UserId: this.request.user?.id || null,
        },
        include: {
          Invoice: true,
          Quotation: true,
          CronTask: true,
        },
      });

      if (!pending_email) throw new AppError("PendingEmail not found!");

      return pending_email;
    }
  );

  return pending_email;
}

/**
 * @this {API.This}
 * @param {Models.Prisma.PendingEmailUncheckedCreateInput & { CronTask: Models.Prisma.CronTaskUncheckedCreateInput & { time: string } }} body
 * @returns {Promise<Models.PendingEmail>}
 */
export async function createPendingEmail(body) {
  const pending_email = await prisma.pendingEmail.create({
    data: {
      recipientEmail: settings.email.replace || body.recipientEmail,
      fromAddress: settings.email.from,
      fromName: settings.email.from_name,
      bbcRecipientEmail: "",
      subject: body.subject,
      content: body.content,
      sent: false,
      InvoiceId: body.InvoiceId,
      QuotationId: body.QuotationId,
      UserId: this.request.user.id,
    },
  });

  const date = dayjs(body.CronTask.date);
  const time = body.CronTask.time.split(":");
  await prisma.cronTask.create({
    data: {
      date: date.set("hour", +time[0]).set("minute", +time[1]).set("second", +time[2]).toDate(),
      dateIntervalType: "month",
      dateIntervalValue: 0,
      active: true,
      function: "sendPendingEmail",
      params: JSON.stringify({ PendingEmailId: pending_email.id }),
      errorMessage: null,
      tryCounts: 0,
      UserId: this.request.user.id,
      PendingEmailId: pending_email.id,
    },
  });

  let parentModel;
  if (body.InvoiceId) {
    parentModel = await prisma.invoices.findUnique({
      where: {
        id: body.InvoiceId,
      },
      select: {
        CustomerId: true,
      },
    });
  } else if (body.QuotationId) {
    parentModel = await prisma.quotations.findUnique({
      where: {
        id: body.QuotationId,
      },
      select: {
        CustomerId: true,
      },
    });
  }
  parentModel && (await invalidateCache(`user_${this.request.user?.id}_customer_${parentModel.CustomerId}_invoices`));
  return pending_email;
}

/**
 * @this {API.This}
 * @param {string} pendingEmailId
 * @param {Models.Prisma.PendingEmailUncheckedUpdateInput & { CronTask: Models.Prisma.CronTaskUncheckedUpdateInput & { time: string }}} body
 * @returns {Promise<Models.PendingEmail & {CronTask: Models.CronTask}>}
 */
export async function updatePendingEmail(pendingEmailId, body) {
  let pending_email = await prisma.pendingEmail.findFirst({
    where: {
      id: +pendingEmailId,
      UserId: this.request.user?.id || null,
    },
    include: {
      CronTask: true,
      Invoice: {
        select: {
          CustomerId: true,
        },
      },
      Quotation: {
        select: {
          CustomerId: true,
        },
      },
    },
  });

  if (!pending_email) throw new AppError("PendingEmail not found!");

  const date = dayjs(body.CronTask.date);
  const time = body.CronTask.time.split(":");
  await prisma.cronTask.update({
    where: {
      PendingEmailId: +pending_email.id,
    },
    data: {
      date: date.set("hour", +time[0]).set("minute", +time[1]).set("second", +time[2]).toDate(),
      active: body.CronTask.active,
    },
  });

  pending_email = await prisma.pendingEmail.update({
    where: {
      id: +pendingEmailId,
    },
    data: {
      recipientEmail: body.recipientEmail,
      subject: body.subject,
      content: body.content,
    },
    include: {
      CronTask: true,
      Invoice: true,
      Quotation: true,
    },
  });

  const customerId = pending_email?.Invoice?.CustomerId || pending_email?.Quotation?.CustomerId;
  await invalidateCache(`user_${this.request.user?.id}_customer_${customerId}_invoices`);
  return pending_email;
}

/**
 * @this {API.This}
 * @param {string} pendingEmailId
 */
export async function deletePendingEmail(pendingEmailId) {
  await prisma.pendingEmail.delete({
    where: {
      id: +pendingEmailId,
      UserId: this.request.user?.id || null,
    },
  });
  await invalidateCache(`user_${this.request.user?.id}_pending_emails`);
}

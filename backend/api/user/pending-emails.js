import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { prisma, Models } from "../../utils/prisma.js";
import { AppError } from "../../utils/AppError.js";
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
 * @param {number} pending_email_id
 * @returns {Promise<Models.pending_email & { invoices: Models.invoice[], cron_task: Models.cron_task[] }>}
 */
export async function getPendingEmail(pending_email_id) {
  let error;
  const pending_email = await getOrSetCache(
    `user_${this.request.user?.id}_pending_email_${pending_email_id}`,
    async () => {
      try {
        const pending_email = await prisma.pending_email.findFirst({
          where: {
            id: +pending_email_id,
            user_id: this.request.user?.id || null,
          },
          include: {
            invoice: true,
            quotation: true,
            cron_task: true,
          },
        });

        if (!pending_email) throw new AppError("PendingEmail not found!");

        return pending_email;
      } catch (err) {
        error = err;
        throw new Error(err);
      }
    }
  );

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  return pending_email;
}

/**
 * @this {API.This}
 * @param {Models.Prisma.pending_emailUncheckedCreateInput & { cron_task: Models.Prisma.cron_taskUncheckedCreateInput & { time: string } }} body
 * @returns {Promise<Models.pending_email>}
 */
export async function createPendingEmail(body) {
  const pending_email = await prisma.pending_email.create({
    data: {
      recipient_email: body.recipient_email,
      from_address: "",
      from_name: "",
      bbc_recipient_email: "",
      subject: body.subject,
      content: body.content,
      sent: false,
      invoice_id: body.invoice_id,
      quotation_id: body.quotation_id,
      user_id: this.request.user.id,
    },
  });

  const date = dayjs(body.cron_task.date);
  const time = body.cron_task.time.split(":");
  await prisma.cron_task.create({
    data: {
      date: date.set("hour", +time[0]).set("minute", +time[1]).set("second", +time[2]).toDate(),
      date_interval_type: "month",
      date_interval_value: 0,
      active: true,
      function: "sendPendingEmail",
      params: JSON.stringify({ pending_email_id: pending_email.id }),
      error_message: null,
      try_counts: 0,
      user_id: this.request.user.id,
      pending_email_id: pending_email.id,
    },
  });

  let parentModel;
  if (body.invoice_id) {
    parentModel = await prisma.invoice.findUnique({
      where: {
        id: body.invoice_id,
      },
      select: {
        customer_id: true,
      },
    });
  } else if (body.quotation_id) {
    parentModel = await prisma.quotation.findUnique({
      where: {
        id: body.quotation_id,
      },
      select: {
        customer_id: true,
      },
    });
  }
  parentModel && (await invalidateCache(`user_${this.request.user?.id}_customer_${parentModel.customer_id}_invoices`));
  return pending_email;
}

/**
 * @this {API.This}
 * @param {string} pending_email_id
 * @param {Models.Prisma.pending_emailUncheckedUpdateInput & { cron_task: Models.Prisma.cron_taskUncheckedUpdateInput & { time: string }}} body
 * @returns {Promise<Models.pending_email & {cron_task: Models.cron_task}>}
 */
export async function updatePendingEmail(pending_email_id, body) {
  let pending_email = await prisma.pending_email.findFirst({
    where: {
      id: +pending_email_id,
      user_id: this.request.user?.id || null,
    },
    include: {
      cron_task: true,
      invoice: {
        select: {
          customer_id: true,
        },
      },
      quotation: {
        select: {
          customer_id: true,
        },
      },
    },
  });

  if (!pending_email) throw new AppError("Pending email not found!");

  const date = dayjs(body.cron_task.date);
  const time = body.cron_task.time.split(":");
  await prisma.cron_task.update({
    where: {
      pending_email_id: +pending_email.id,
    },
    data: {
      date: date.set("hour", +time[0]).set("minute", +time[1]).set("second", +time[2]).toDate(),
      active: body.cron_task.active,
    },
  });

  pending_email = await prisma.pending_email.update({
    where: {
      id: +pending_email_id,
    },
    data: {
      recipient_email: body.recipient_email,
      subject: body.subject,
      content: body.content,
    },
    include: {
      cron_task: true,
      invoice: true,
      quotation: true,
    },
  });

  const customer_id = pending_email?.invoice?.customer_id || pending_email?.quotation?.customer_id;
  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_invoices`);
  return pending_email;
}

/**
 * @this {API.This}
 * @param {string} pending_email_id
 */
export async function deletePendingEmail(pending_email_id) {
  await prisma.pending_email.delete({
    where: {
      id: +pending_email_id,
      user_id: this.request.user?.id || null,
    },
  });
  await invalidateCache(`user_${this.request.user?.id}_pending_emails`);
}

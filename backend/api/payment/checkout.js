import stripe from "../../utils/stripe.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$post("/checkout", createCheckout);
}

/**
 * @this {API.This}
 * @param {{ redirectUrl: string, backUrl: string }} body
 */
async function createCheckout(body) {
  let session;
  session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // TODO: price from env
        price: "price_1N7vsWGesxfbePZU8VuGvtfm",
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: body.redirectUrl,
    cancel_url: body.backUrl,
  });

  if (session.url) this.reply.redirect(session.url);
}

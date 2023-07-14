import stripe from "../../util/stripe.js";

async function routes(app) {
  app.post(
    "/checkout",
    async (
      /** @type {API.This["request"] & { body: { redirectUrl: string, backUrl: string }}} */ request,
      /** @type {API.This["reply"]} */ reply
    ) => {
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
        success_url: request.body.redirectUrl,
        cancel_url: request.body.backUrl,
      });

      if (session.url) reply.redirect(session.url);
    }
  );
}

export default routes;

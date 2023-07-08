import stripe from "../../util/stripe.js";

async function routes(app, options) {
  app.post("/checkout", async (request, reply) => {
    let session;
    session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1N7vsWGesxfbePZU8VuGvtfm",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: request.body.redirectUrl,
      cancel_url: request.body.backUrl,
    });

    // TODO: check this works
    if (session.url) reply.redirect(session.url);
  });
}

export default routes;

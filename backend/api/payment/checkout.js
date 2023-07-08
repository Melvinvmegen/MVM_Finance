import express from "express";
import stripe from "../../util/stripe.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1N7vsWGesxfbePZU8VuGvtfm",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: req.body.redirectUrl,
      cancel_url: req.body.backUrl,
    });
  } catch (error) {
    return next(error);
  }

  if (session.url) res.redirect(session.url);
});

export default router;
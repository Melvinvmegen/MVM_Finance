import Stripe from 'stripe';
import express, { Request, Response, NextFunction } from "express";
import { settings } from "../../util/settings.js";

const stripe = new Stripe(
  settings.stripe.apiKey,
  {
    apiVersion: "2022-11-15",
  }
);

const router = express.Router();

router.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  const redirectUrl = req.body.redirectUrl;
  const backUrl = req.body.backUrl;
  let session;
  try {    
    session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1N5UUkGesxfbePZUaUQwN18I",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: redirectUrl,
      cancel_url: backUrl,
    });
  } catch (error) {
    return next(error);
  }

  if (session.url) res.redirect(session.url);
});

export default router;
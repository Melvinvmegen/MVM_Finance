import Stripe from "stripe";
export * as StripeTypes from "stripe";
import { settings } from "./settings.js";

const stripe = new Stripe(settings.stripe.apiKey, {
  apiVersion: "2022-11-15",
});

export default stripe;

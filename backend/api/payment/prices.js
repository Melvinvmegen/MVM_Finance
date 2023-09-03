import { AppError } from "../../utils/AppError.js";
import stripe, { StripeTypes } from "../../utils/stripe.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/prices/:productId", getPrice);
}

/**
 * @this {API.This}
 * @param {string} productId
 * @returns {Promise<StripeTypes.Stripe.Price[]>}
 */
async function getPrice(productId) {
  const prices = await stripe.prices.list({
    product: productId,
    limit: 100,
  });

  if (!prices.data.length) throw new AppError("Not found");

  return prices.data.map((price) => ({
    ...price,
  }));
}

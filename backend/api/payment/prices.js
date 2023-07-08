import { AppError } from "../../util/AppError.js";
import stripe from "../../util/stripe.js";

async function routes(app, options) {
  app.get("/prices/:productId", async (request, reply) => {
    const prices = await stripe.prices.list({
      product: request.params.productId,
      limit: 100,
    });

    if (!prices.data.length) throw new AppError(404, "Not found");

    return prices.data.map((price) => ({
      ...price,
    }));
  });
}

export default routes;

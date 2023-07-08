import express from "express";
import { AppError } from "../../util/AppError.js";
import stripe from "../../util/stripe.js";

const router = express.Router();

router.get("/:productId", async (req, res, next) => {
  try {
    const prices = await stripe.prices.list({
      product: req.params.productId,
      limit: 100,
    });

    if (!prices.data.length) throw new AppError(404, "Not found");

    res.json(
      prices.data.map((price) => ({
        ...price,
      }))
    );
  } catch (error) {
    return next(error);
  }
});

export default router;

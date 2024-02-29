import { prisma } from "./prisma.js";

export const validateCustomerBelongsToUser = async (req) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id: +req?.params?.customer_id,
      user_id: +req?.user?.id,
    },
  });

  return !!customer;
};

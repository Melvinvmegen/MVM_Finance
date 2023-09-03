import { prisma } from "./prisma.js";

export const validateCustomerBelongsToUser = async (req) => {
  const customer = await prisma.customers.findFirst({
    where: {
      id: +req?.params?.CustomerId,
      UserId: +req?.user?.id,
    },
  });

  return !!customer;
};

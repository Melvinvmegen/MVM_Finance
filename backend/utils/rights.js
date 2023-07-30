import { prisma } from "./prisma.js";

export const validateBelongsToUser = (req) => {
  if (req.user?.userId != req.params?.user_id) {
    return false;
  }
  return true;
};

export const validateCustomerBelongsToUser = async (req) => {
  try {
    await prisma.customers.findFirst({
      where: {
        id: +req?.params?.customer_id,
        UserId: +req?.user?.userId,
      },
    });
  } catch (error) {
    return false;
  }

  return true;
};

export const validateBelongsToBank = async (req) => {
  const user = await prisma.users.findUnique({
    where: {
      id: +req?.user?.userId,
    },
    include: {
      Banks: true,
    },
  });

  const banks = user?.Banks?.filter((bank) => bank.id === Number(req.params?.bank_id));

  if (!banks?.length) return false;

  // @ts-ignore
  req.originalParams = Object.assign({}, req.params);
  return true;
};

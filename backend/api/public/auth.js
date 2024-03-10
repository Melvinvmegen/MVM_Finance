import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import { AppError } from "../../utils/AppError.js";
import { prisma, Models } from "../../utils/prisma.js";
import { randomUUID } from "crypto";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  // app.$post("/signup", signUp);
  app.$post("/signin", signIn);
  app.$get("/logout", logout);
  app.$get("/who-am-i", whoAmI);
}

/**
 * @this {API.This}
 * @param {{ email: string, password: string }} body
 * @returns {Promise<Models.user>}
 */
export async function signUp(body) {
  const { email, password } = body;
  let user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (user) throw new AppError("A user with this email already exists !");
  const hashedPassword = await bcrypt.hash(password, 12);
  user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  return user;
}

/**
 * @this {API.This}
 * @param {{ email: string, password: string }} body
 * @returns {Promise<{id: number, email: string, cryptos_module_active: boolean, customers_module_active: boolean, withholding_tax_active: boolean, auth_ticket: string, investment_goal: number, cryptos_module_active: boolean }>}
 */
export async function signIn({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      investment_profile: true,
    },
  });
  if (!user) throw new AppError("errors.server.noUserFound");

  const passwordCheck = await bcrypt.compare(password, user.password);
  if (!passwordCheck) {
    throw new AppError("errors.server.wrongCredentials");
  }

  const auth_ticket = randomUUID();

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      auth_ticket,
      last_login: dayjs().toDate(),
    },
  });

  const me = {
    id: user.id,
    email: user.email,
    cryptos_module_active: user.cryptos_module_active,
    customers_module_active: user.customers_module_active,
    revenus_module_active: user.revenus_module_active,
    investment_goal: user.investment_profile.investment_goal,
    withholding_tax_active: user.investment_profile.withholding_tax_active,
  };

  this.reply.setCookie("MVMTOKEN", await this.reply.jwtSign(me), {
    domain: /\.com$/.test(this.request.hostname)
      ? "." + this.request.hostname.split(":")[0].split(".").slice(1).join(".")
      : this.request.hostname.split(":")[0],
    path: "/",
    secure: false,
    httpOnly: true,
    sameSite: true, // alternative CSRF protection
  });

  return { ...me, auth_ticket };
}

/**
 * @this {API.This}
 */
export async function logout() {
  this.reply.clearCookie("MVMTOKEN", {
    domain: this.request.hostname.split(":")[0].substring(this.request.hostname.indexOf(".")),
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: true,
  });
}

/**
 * @this {API.This}
 * @returns {Promise<API.LoggedUser>}
 */
export async function whoAmI() {
  return this.request.user;
}

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
 * @returns {Promise<Models.Users>}
 */
export async function signUp(body) {
  const { email, password } = body;
  let user = await prisma.users.findUnique({
    where: { email: email },
  });
  if (user) throw new AppError("A user with this email already exists !");
  const hashedPassword = await bcrypt.hash(password, 12);
  user = await prisma.users.create({
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
 * @returns {Promise<{id: number, email: string, cryptosModuleActive: boolean, customersModuleActive: boolean, revenusModuleActive: boolean, authTicket: string }>}
 */
export async function signIn({ email, password }) {
  const user = await prisma.users.findUnique({
    where: { email: email.trim() },
  });
  if (!user) throw new AppError("errors.server.noUserFound");

  const passwordCheck = await bcrypt.compare(password, user.password);
  if (!passwordCheck) {
    throw new AppError("errors.server.wrongCredentials");
  }

  const authTicket = randomUUID();

  await prisma.users.update({
    where: {
      id: user.id,
    },
    data: {
      authTicket: authTicket,
      lastLogin: dayjs().toDate(),
    },
  });

  const me = {
    id: user.id,
    email: user.email,
    cryptosModuleActive: user.cryptosModuleActive,
    customersModuleActive: user.customersModuleActive,
    revenusModuleActive: user.revenusModuleActive,
    investment_goal: user.investment_goal,
    withholding_tax_active: user.withholding_tax_active,
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

  return { ...me, authTicket };
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

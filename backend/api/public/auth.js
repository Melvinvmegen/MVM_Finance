import bcrypt from "bcryptjs";
import { settings } from "../../util/settings.js";
import { AppError } from "../../util/AppError.js";
import { prisma } from "../../util/prisma.js";

async function routes(app, options) {
  app.post("/signup", async (request, reply) => {
    const { email } = request.body;

    let user = await prisma.users.findUnique({
      where: { email: email },
    });
    if (user) throw new AppError(422, "A user with this email already exists !");
    const hashedPassword = await bcrypt.hash(request.body.password, 12);
    user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return user;
  });

  app.post("/login", async (request, reply) => {
    const user = await prisma.users.findUnique({
      where: { email: request.body.email },
    });
    if (!user) throw new AppError(404, "Incorrect credentials, please check your login and password");

    const passwordCheck = await bcrypt.compare(request.body.password, user.password);
    if (!passwordCheck) {
      throw new AppError(404, "Email and password don't match!");
    }

    const token = createToken(reply, { email: user.email, userId: user.id }, +settings.jwt.expiresIn);
    const refresh_token = createToken(reply, { userId: user.id }, +settings.jwt.refreshTokenExpiration);
    await prisma.refreshTokens.create({
      data: {
        createdAt: new Date(),
        updatedAt: new Date(),
        token: refresh_token,
        expiryDate: new Date(new Date().getTime() + +settings.jwt.refreshTokenExpiration * 1000),
        UserId: user.id,
      },
    });

    return {
      message: "Successfully signed in",
      userId: user.id,
      refresh_token,
      token,
      cryptosModuleActive: user.cryptosModuleActive,
      customersModuleActive: user.customersModuleActive,
      revenusModuleActive: user.revenusModuleActive,
    };
  });

  app.post("/refreshtoken", async (request, reply) => {
    const { refreshToken } = request.body;

    if (!refreshToken) throw new AppError(403, "Refresh Token is required!");

    const refresh_token = await prisma.refreshTokens.findFirst({
      where: { token: refreshToken },
      include: { Users: true },
    });
    if (!refresh_token) throw new AppError(403, "Refresh Token not found!");

    if (refresh_token.expiryDate.getTime() < new Date().getTime()) {
      await prisma.refreshTokens.delete({
        where: { id: refresh_token.id },
      });
      throw new AppError(403, "Refresh token was expired. Please login");
    }

    const token = createToken(
      reply,
      { email: refresh_token.Users?.email, userId: refresh_token.id },
      +settings.jwt.expiresIn
    );

    return {
      token,
      refreshToken: refresh_token.token,
    };
  });
}

const createToken = (reply, payload, expiresIn) => {
  return reply.jwtSign(payload, settings.jwt.secret, {
    algorithm: "HS512",
    expiresIn,
  });
};

export default routes;

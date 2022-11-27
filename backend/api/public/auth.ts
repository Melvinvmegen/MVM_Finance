import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { settings } from "../../util/settings.js";
import { AppError } from "../../util/AppError.js";
import { prisma } from "../../util/prisma.js";

const router = express.Router();

router.post("/signup", async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
      let user = await prisma.users.findUnique({
        where: { email: email },
      });
      if (user) throw new AppError(422, "A user with this email already exists !");
      const hashedPassword = await bcrypt.hash(req.body.password, 12);
      user = await prisma.users.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      res.json(user);
    } catch (error) {
      if (!res.statusCode) {
        res.statusCode = 500;
      }
      return next(error);
    }
  }
);

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.users.findUnique({
        where: { email: req.body.email },
      });
      if (!user)
        throw new AppError(
          404,
          "Incorrect credentials, please check your login and password"
        );

      const passwordCheck = bcrypt.compare(req.body.password, user.password);
      if (!passwordCheck)
        throw new AppError(404, "Email and password don't match!");

      const token = createToken(
        { email: user.email, userId: user.id },
        +settings.jwt.expiresIn
      );
      const refresh_token = createToken(
        { userId: user.id },
        +settings.jwt.refreshTokenExpiration
      );
      await prisma.refreshTokens.create({
        data: {
          createdAt: new Date(),
          updatedAt: new Date(),
          token: refresh_token,
          expiryDate: new Date(
            new Date().getTime() + +settings.jwt.refreshTokenExpiration * 1000
          ),
          UserId: user.id,
        },
      });

      res.json({
        message: "Successfully signed in",
        userId: user.id,
        refresh_token,
        token,
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post("/refreshtoken", async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) throw new AppError(403, "Refresh Token is required!");
    
    try {
      const refresh_token = await prisma.refreshTokens.findFirst({
        where: { token: refreshToken },
        include: { Users: true },
      });
      if (!refresh_token) throw new AppError(403, "Refresh Token not found!");

      if (refresh_token.expiryDate.getTime() < new Date().getTime()) {
        await prisma.refreshTokens.delete({
          where: { id: refresh_token.id }
        });
        throw new AppError(403, "Refresh token was expired. Please login");
      }

      const token = createToken(
        { email: refresh_token.Users?.email, userId: refresh_token.id },
        +settings.jwt.expiresIn
      );

      res.json({
        token,
        refreshToken: refresh_token.token,
      });
    } catch (error) {
      return next(error);
    }
  }
);

const createToken = (payload: {}, expiresIn: number) => {
  return jwt.sign(payload, settings.jwt.secret, {
    algorithm: "HS512",
    expiresIn,
  });
};

export default router;

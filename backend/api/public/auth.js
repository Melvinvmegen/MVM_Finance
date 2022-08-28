const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const settings = require("../../util/settings");
const AppError = require("../../util/AppError");
const router = require('express').Router();
const { alreadyError } = require('../../util/errorHandler')
const { db }  = require('../../util/database')

router.post('/signup', async (req, res, next) => {
  const email = req.body.email

  try {
    const [user] = await db.select('*').from('Users').where('email', email)
    if (user) {
      const error = new Error('A user with this email already exists !')
      error.statusCode = 422
      return next(error)
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12)
    const [created_user] = await db('Users').insert({email, password: hashedPassword}).returning('*')
    res.status(201).json({message: 'User successfully created!', user: created_user})
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error)
  }
})

router.post('/login', async (req, res, next) => {

  try {
    const [user] = await db.select('*').from('Users').where('email', req.body.email)
    if (!user) throw new AppError(404, "Incorrect credentials, please check your login and password");

    const passwordCheck = await bcrypt.compare(req.body.password, user.password);
    if (!passwordCheck) throw new AppError(404, "Email and password don't match!");

    const token = createToken({ email: user.email, userId: user.id }, settings.jwt.expiresIn)
    const refresh_token = createToken({ userId: user.id }, settings.jwt.refreshTokenExpiration)
    await db('RefreshTokens').insert({
      createdAt: new Date(),
      updatedAt: new Date,
      token: refresh_token,
      expiryDate: new Date(new Date().getTime() + settings.jwt.refreshTokenExpiration * 1000),
      UserId: user.id,
    }).returning('*');

    res
      .status(200)
      .json({
        message: "Successfully signed in",
        userId: user.id,
        refresh_token,
        token,
      });
  } catch (error) {
    return next(error);
  }
});

router.post("/refreshtoken", async (req, res, next) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) return alreadyError(next, "Refresh Token is required!")

  try {
    const [refresh_token] = await db.select('*').from('RefreshTokens').join("Users", "RefreshTokens.UserId", "Users.id").where('token', refreshToken)
    if (!refresh_token) return alreadyError(next, "Refresh Token not found!");

    if (refresh_token.expiryDate.getTime() < new Date().getTime()) {
      await db('RefreshTokens').where({ id: refresh_token.id }).del()
      const error = new Error("Refresh token was expired. Please login");
      error.statusCode = 403;
      return next(error);
    }
    const token = createToken({ email: refresh_token.email, userId: refresh_token.id }, settings.jwt.expiresIn)

    res.status(200).json({
      token,
      refreshToken: refresh_token.token,
    });
  } catch (error) {
    return next(error)
  }
});


const createToken = (payload, expiresIn) => {
  return jwt.sign(
    payload,
    settings.jwt.secret,
    {
      algorithm: settings.jwt.algorithms[0],
      expiresIn,
    }
  );
}

module.exports = router;
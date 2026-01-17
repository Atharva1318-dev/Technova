import express from "express";
import dotenv from "dotenv";
const AuthRouter = express.Router();
import {
  SignUp,
  Login,
  googleAuth,
  logout,
  checkUserExists,
} from "../controller/auth.controller.js";

AuthRouter.post("/signup", SignUp);
AuthRouter.post("/login", Login);
AuthRouter.post("/google", googleAuth);
AuthRouter.post("/logout", logout);
AuthRouter.post("/check-user", checkUserExists);
export default AuthRouter;

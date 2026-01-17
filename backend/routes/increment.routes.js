import express from "express";
import { incrementCounter } from "../controller/increment.controller.js";

const IncrementRouter = express.Router();

IncrementRouter.get("/counter", incrementCounter);

export default IncrementRouter;
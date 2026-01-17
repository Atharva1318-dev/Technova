import express from "express";
import { searchAndSummarize } from "../controller/aiNews.controller.js";

const AINewsRouter = express.Router();

// Single endpoint: Search + Summarize
AINewsRouter.get("/search", searchAndSummarize);

export default AINewsRouter;
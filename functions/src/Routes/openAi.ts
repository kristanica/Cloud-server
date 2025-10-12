import express from "express";
import { middleWare } from "../Middleware/middleWare";
import { gamePrompt } from "../Controllers/openAi/gamePrompt";
import { brainBytesPrompts } from "../Controllers/openAi/brainBytesPrompts";
import { lessonPrompt } from "../Controllers/openAi/lessonPrompt";
import { codeCrafter } from "../Controllers/openAi/codeCrafter";
import { codeRushPrompts } from "../Controllers/openAi/codeRushPrompts";
import { bugBustPrompt } from "../Controllers/openAi/bugBustPrompt";
import { codePlaygroundEval } from "../Controllers/openAi/codePlaygroundEval";

const openAiRoute = express.Router();

openAiRoute.post("/gamePrompt", middleWare, gamePrompt);
openAiRoute.post("/lessonPrompt", middleWare, lessonPrompt);
openAiRoute.post("/codeCrafter", middleWare, codeCrafter);
openAiRoute.post("/codeRush", middleWare, codeRushPrompts);
openAiRoute.post("/bugBust", middleWare, bugBustPrompt);
openAiRoute.post("/codePlaygroundEval", middleWare, codePlaygroundEval);
openAiRoute.post("/evaluate", middleWare, brainBytesPrompts);

export default openAiRoute;

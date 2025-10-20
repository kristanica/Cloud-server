import express from "express";
import { middleWare } from "../Middleware/middleWare";
import { gamePrompt } from "../Controllers/openAi/gamePrompt";
import { bugBustPrompt } from "../Controllers/openAi/bugBustPrompt";
import { codeRushPrompts } from "../Controllers/openAi/codeRushPrompts";
import { codeCrafter } from "../Controllers/openAi/codeCrafter";
import { lessonPrompt } from "../Controllers/openAi/lessonPrompt";
import { lessonPromptDb } from "../Controllers/openAi/lessonPromptDb";
import { feedbackPrompts } from "../Controllers/openAi/feedbackPrompts";

import { codePlaygroundEval } from "../Controllers/openAi/codePlaygroundEval";
import { dbPlayGroundEval } from "../Controllers/openAi/dbPlayGroundEval";
import { codeWhisper } from "../Controllers/openAi/codeWhisper";

const openAiRoute = express.Router();

openAiRoute.post("/gamePrompt", middleWare, gamePrompt);
openAiRoute.post("/lessonPrompt", middleWare, lessonPrompt);
openAiRoute.post("/lessonPromptDb", middleWare, lessonPromptDb);
openAiRoute.post("/bugBustPrompt", middleWare, bugBustPrompt);
openAiRoute.post("/codeCrafter", middleWare, codeCrafter);
openAiRoute.post("/codeRushPrompts", middleWare, codeRushPrompts);
openAiRoute.post("/feedbackPrompts", middleWare, feedbackPrompts);

openAiRoute.post("/codePlaygroundEval", middleWare, codePlaygroundEval);
openAiRoute.post("/databasePlaygroundEval", middleWare, dbPlayGroundEval);
openAiRoute.post("/codeWhisper", middleWare, codeWhisper);
export default openAiRoute;

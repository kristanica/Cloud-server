import { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export const feedbackPrompts = async (req: Request, res: Response) => {
  const { levelId, stageFeedbacks } = req.body;

  if (!stageFeedbacks || stageFeedbacks.length === 0) {
    return res.status(400).send({ message: "No stage feedback found for this level." });
  }

  const stageResults = stageFeedbacks
    .map(
      (s: any, i: number) =>
        `${i + 1}. ${s.stageId}: ${s.evaluation}. Feedback: "${s.feedback}"`
    )
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
System Message:
You are a coding mentor for DevLab. 
The user has completed all stages in a level.
Your job is to give a complete Level Summary that includes:
1. A short recap of what was practiced (infer from feedback).
2. Strengths based on correct answers.
3. Suggestions for improvement based on incorrect answers.
4. An encouraging message.

Be concise and supportive.

Output JSON format:
{
  "recap": "...",
  "strengths": "...",
  "improvements": "...",
  "encouragement": "..."
}`,
      },
      {
        role: "user",
        content: `
The user completed Level ${levelId}.
Here are the stage results:${stageResults}`,
      },
    ],
  });

  const reply = response.choices[0].message?.content;

  if (!reply) {
    return res.status(400).send({ message: "AI did not return a summary" });
  }

  console.log("Level Summary:", reply);

  return res.send({ response: reply });
};

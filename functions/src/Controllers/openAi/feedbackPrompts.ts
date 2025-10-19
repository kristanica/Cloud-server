import { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export const feedbackPrompts = async (req: Request, res: Response) => {
  try {
    const { stageFeedbacks } = req.body;

    if (!stageFeedbacks || stageFeedbacks.length === 0) {
      return res
        .status(400)
        .send({ message: "No stage feedback found for this level." });
    }

    const stageResults = stageFeedbacks
      .map(
        (s: any, i: number) =>
          `${i + 1}. Stage ID: ${s.stageId}\n   Evaluation: ${s.evaluation}\n   Feedback: "${s.feedback}"`
      )
      .join("\n\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a friendly coding mentor for DevLab.
The learner is a **Beginner**. Keep your tone warm and easy to understand.

Create a **very short level summary** (1 sentence per field, max 20 words each).
Be concise and supportive.

### Include:
1. "recap" — what was practiced or learned.
2. "strengths" — what was done well.
3. "improvements" — what can be improved, gently phrased.
4. "encouragement" — a motivating closing note.

### Output only valid JSON:
{
  "recap": "...",
  "strengths": "...",
  "improvements": "...",
  "encouragement": "..."
}
`,
        },
        {
          role: "user",
          content: `Here are the stage results:\n${stageResults}`,
        },
      ],
    });

    const reply = response.choices[0].message?.content;

    if (!reply) {
      return res.status(400).send({ message: "AI did not return a summary." });
    }

    console.log("Level Summary:", reply);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(reply);
    } catch {
      parsedResponse = { raw: reply };
    }

    return res.status(200).json({ response: parsedResponse });
  } catch (error: any) {
    console.error("Error generating feedback summary:", error);
    return res.status(500).json({
      message: "Failed to generate feedback summary.",
      error: error.message,
    });
  }
};

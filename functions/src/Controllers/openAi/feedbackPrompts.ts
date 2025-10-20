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
    console.log(stageResults);
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a supportive coding mentor for DevLab, helping beginners learn programming.

Analyze the stage-by-stage performance data provided and create a concise level completion summary.

**Guidelines:**
- Write in a warm, encouraging tone suitable for beginners
- Keep each field to 1-2 sentences (max 25 words per field)
- Focus on specific skills practiced, not generic praise
- When mentioning improvements, be constructive and specific
- Base your summary on the actual evaluation data provided

**Required JSON format:**
{
  "recap": "Summarize the main coding concepts or skills practiced across all stages",
  "strengths": "Highlight specific things done well based on the evaluations (e.g., correct tag usage, proper syntax)",
  "improvements": "Suggest one concrete, gentle improvement based on feedback (if all correct, mention consistency or best practices)",
  "encouragement": "End with a personalized motivational message that acknowledges their progress"
}

**Important:** 
- Reference specific technologies/concepts from the evaluations (e.g., HTML tags, CSS properties, JavaScript syntax)
- If all feedback is "Correct", focus improvements on code quality, readability, or best practices
- Make it personal and specific to their actual performance
`,
        },
        {
          role: "user",
          content: `Analyze these stage completion results and provide a performance summary:

${stageResults}

Generate a JSON summary following the required format.`,
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

import { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export const dbPlayGroundEval = async (req: Request, res: Response) => {
  const { sql } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
System Message:
You are an Expert Database Developer and AI Playground Evaluator.
Treat the user as a beginner in SQL and databases.
Your job is to review SQL code and give beginner-friendly feedback and improvement suggestions.
Do NOT suggest complex queries or advanced concepts — keep suggestions simple and easy to understand.
If the syntax is correct and there are no improvements needed, do not suggest any advanced ideas.
Keep feedback slightly shorter while still clear and helpful.
Be friendly and encouraging.

Rules:
1. Review only non-empty SQL code.
2. Provide feedback on:
   - Query structure
   - Syntax correctness
   - Performance and optimization ideas suitable for beginners
3. In "queryImprovement", if there is a syntax error or bug, give an **example correction** showing the fixed query.
4. If syntax is correct and there are no errors, give only a simple improvement idea or reassurance without advanced suggestions.
5. Focus on readability, syntax correctness, and beginner-friendly optimization tips.
6. Ignore database names and variable naming unless they cause syntax errors.
7. Do NOT mark code as right or wrong — this is for learning and exploration.

Output JSON Format:
{
  "queryFeedback": "Short, beginner-friendly feedback on the SQL query",
  "queryImprovement": "Brief, clear improvement suggestion for the SQL query with example correction if there is a syntax error or bug (simple and beginner-friendly) and also motivate the User"
}
        `,
      },
      {
        role: "user",
        content: `
SQL = "${sql}"
        `,
      },
    ],
  });

  if (!response) {
    return res.status(400).send({ message: "AI call failed" });
  }

  const reply = response.choices[0].message?.content;
  console.log("Database Playground Prompt Response:", reply);

  return res.send({ response: reply });
};

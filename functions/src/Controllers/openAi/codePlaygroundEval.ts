import { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export const codePlaygroundEval = async (req: Request, res: Response) => {
  const { html, css, js } = req.body;
  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
System Message:
You are an Expert Frontend Developer and AI Playground Evaluator.
Treat the user as a beginner in web development.
Your job is to review HTML, CSS, and JavaScript separately and give beginner-friendly feedback.
Do NOT suggest linking HTML, CSS, or JavaScript together — treat them as independent code blocks.
Keep feedback slightly shorter while still clear and helpful.
Be friendly and encouraging.

Rules:
1. Review only non-empty code blocks.
2. Review HTML, CSS, and JS separately.
3. Provide an overall improvement suggestion for all code combined, but do NOT suggest linking them.
4. Focus on:
   - Syntax correctness
   - Readability
   - Best practices
   - Beginner-friendly improvement tips
5. Ignore grammar/spelling inside content and naming of classes, IDs, or variables.
6. Do NOT label code as right or wrong — this is for learning and practice.

Output JSON Format:
{
  "htmlFeedback": "Short, beginner-friendly feedback for HTML",
  "cssFeedback": "Short, beginner-friendly feedback for CSS",
  "jsFeedback": "Short, beginner-friendly feedback for JavaScript",
  "overallImprovement": "Brief beginner-friendly improvement suggestion combining all code and also motivate the User"
}
        `,
      },
      {
        role: "user",
        content: `
HTML = "${html}"
CSS = "${css}"
JS = "${js}"
        `,
      },
    ],
  });

  if (!response) {
    return res.status(400).send({ message: "AI call failed" });
  }

  const reply = response.choices[0].message?.content;

  return res.send({ response: reply });
};
// IMPORTANT: Include your feedback wrapped in simple HTML tags such as <p></p> or <div></div> using inline CSS styles for styling and highlighting important parts. For example, use <p style="color:red; font-weight:bold;">Important feedback here</p>. Avoid React Native JSX tags like <Text> or <View>, just use standard HTML that can be rendered by a HTML renderer.

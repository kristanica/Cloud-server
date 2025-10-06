import { Request, Response } from "express";
import dotenv from "dotenv";

import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
export const lessonPrompt = async (req: Request, res: Response) => {
  const { instructions, description, html, css,js } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
System Message:
You are an Expert Frontend Developer and AI Teacher for DevLab's Lesson Mode.  
Your role is to **guide and mentor students** on HTML, CSS, and JavaScript.  
There are no "Correct" or "Incorrect" judgments here — only professional guidance and teaching.

Inputs you receive:
- HTML, CSS, JavaScript code blocks (may be empty if not used).  
- INSTRUCTIONS → what the student is trying to achieve.  
- DESCRIPTION → context about the lesson.  

Teaching Rules:
1. Always explain in a clear, encouraging, professional tone.  
2. Start with what the student did well.  
3. Then explain how the code relates to the INSTRUCTION and DESCRIPTION.  
4. Provide at least one **actionable suggestion** (syntax, structure, formatting, or best practice).  
5. Focus separately on each block (HTML, CSS, JS) if provided.  
   - **HTML** → check tag structure, nesting, missing/extra tags.  
   - **CSS** → check selectors, properties, semicolons, valid syntax.  
   - **JS** → check variables, functions, loops, brackets, semicolons.  
6. Ignore:
   - Grammar/spelling/text content inside tags.  
   - Naming of classes, IDs, or variables (only check syntax validity).  


Output JSON Format:
{
  "feedback": "Explanation why the code is good/ok/bad",
  "suggestion": "One actionable improvement or best practice tip."
}

Example:
{
  "feedback": "Explanation why is Code correct or Wrong",
  "suggestion": "Indent nested HTML elements for readability, and always end CSS declarations with semicolons."
}`,
      },
  {
    role: "user",
    content: `
INSTRUCTIONS = "${instructions}"
DESCRIPTION = "${description}"
HTML = "${html}"
CSS = "${css}"
JS = "${js}"
        `,
      },
    ],
  });
  if (!response) {
    return res.status(400).send({ message: "cant call" });
  }

  const reply = response.choices[0].message.content;
  console.log(reply);

  return res.send({ response: reply });
};
//"evaluation": "GOOD | OK | BAD",
import { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export const lessonPromptDb = async (req: Request, res: Response) => {
  const { instructions, description, sql, subject } = req.body;

  if (!subject) {
    return res.status(400).send({ message: "Subject is required." });
  }

  const subjectRules = `
Teaching Rule for Subject (strict):
- If subject is Database: ignore HTML, CSS, and JS completely. Do NOT comment on them at all.
`;

  const emptyCodeRules = `
Additional Rule:
- If the SQL code block is empty or contains no meaningful value, ignore it completely.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
System Message:
You are an Expert Database Developer and AI Teacher for DevLab's Lesson Mode.  
Your role is to guide and mentor students on Database querying (MySQL, SQL, etc.).  
You should teach as if the student is a beginner.  
Your explanations and suggestions must be beginner-friendly and easy to understand.
Make sure the output is not too long and not too short.

${subjectRules}
${emptyCodeRules}

Inputs you receive:
- SQL code block (may be empty if not used).  
- INSTRUCTIONS → what the student is trying to achieve.  
- DESCRIPTION → context about the lesson.  

Teaching Rules:
1. Always explain in a clear, encouraging, and professional tone suitable for beginners.
2. Start feedback with what the student did well.  
3. Explain how the SQL code relates to the INSTRUCTION and DESCRIPTION.  
4. Provide at least one actionable suggestion (syntax, query optimization, structure, or best practice).
5. Use simple language, avoid jargon, and explain technical terms briefly for beginners.
6. Focus only on the relevant SQL code block(s) based on the subject rules above and the empty code rules.
7. Ignore:
   - Naming of tables, columns, or aliases (only check syntax validity).
   - Data content unless specifically relevant to the instruction.

Output JSON Format:
{
  "feedback": "Explanation why the SQL query is good/ok/bad (beginner-friendly, not too long, not too short)",
  "suggestion": "One actionable improvement or best practice tip (beginner-friendly, not too long, not too short)"
}
        `,
      },
      {
        role: "user",
        content: `
Subject = "${subject}"
INSTRUCTIONS = "${instructions}"
DESCRIPTION = "${description}"
SQL = "${sql}"
        `,
      },
    ],
  });

  if (!response) {
    return res.status(400).send({ message: "AI call failed" });
  }

  const reply = response.choices[0].message?.content;
  console.log("Database Lesson Prompt Response:", reply);

  return res.send({ response: reply });
};

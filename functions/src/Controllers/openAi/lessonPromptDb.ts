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
Your role is to teach and mentor beginners in database querying (MySQL, SQL, etc.).  
Do not just describe what the query does — explain *why* it is written that way and *how* it achieves the student’s goal.  
Keep feedback clear, friendly, and concise (max 80 words).

${subjectRules}
${emptyCodeRules}

Inputs you receive:
- SQL code block (may be empty if not used).  
- INSTRUCTIONS → what the student is trying to achieve.  
- DESCRIPTION → context about the lesson.  

Teaching Rules:
0. If the SQL code block is empty or does not contain valid SQL, do not answer general questions. Respond only with: 
   { "feedback": "No SQL detected. Please provide a valid SQL query.", "suggestion": "Ensure your input contains SQL code. We only give feedback on SQL queries." }
1. Begin feedback with encouragement (e.g., “Nice work!” or “Good attempt!”).  
2. Explain how the SQL query works and why it matters for achieving the student’s INSTRUCTION or DESCRIPTION.  
3. Avoid generic explanations — connect the code logic to real database concepts (e.g., selecting data, filtering, joins, normalization).  
4. Include at least one actionable suggestion (syntax fix, query optimization, structure improvement, or best practice).  
5. For every suggestion, briefly explain why it matters (e.g., “This makes the query faster,” or “This avoids duplicate data”).  
6. Use beginner-friendly words and short sentences.  
7. Focus only on SQL — ignore HTML, CSS, JS, or naming issues unless they affect correctness.  

Output JSON Format:
{
  "feedback": "Encouraging and concept-based explanation of what the SQL code does, why it’s correct or useful, and how it fits the student’s goal.",
  "suggestion": "One improvement or best practice, including a brief explanation of why it helps."
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

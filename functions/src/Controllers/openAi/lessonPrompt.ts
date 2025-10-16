import { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export const lessonPrompt = async (req: Request, res: Response) => {
  const { instructions, description, html, css, js, subject } = req.body;

  if (!subject) {
    return res.status(400).send({ message: "Subject is required." });
  }

  const subjectRules = `
Teaching Rule for Subject (strict):
- If subject is HTML: ignore CSS and JS completely. Do NOT comment on them at all.
- If subject is CSS: ignore JS completely. Do NOT comment on JS.
- If subject is JS: evaluate HTML, CSS, and JS.
`;

  const emptyCodeRules = `
Additional Rule:
- If the HTML code block is empty or contains no meaningful value, ignore it completely.
- If the CSS code block is empty or contains no meaningful value, ignore it completely.
- If the JS code block is empty or contains no meaningful value, ignore it completely.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
System Message:
You are an Expert Frontend Developer and AI Teacher for DevLab's Lesson Mode.  
Your role is to teach and mentor beginners on HTML, CSS, and JavaScript — not just describe code, but explain the *why* behind it.  
Be friendly, concise (max 80 words), and always give meaningful feedback that helps the student *understand and improve*.

${subjectRules}
${emptyCodeRules}

Inputs you receive:
- HTML, CSS, JavaScript code blocks (may be empty if not used).  
- INSTRUCTIONS → what the student is trying to achieve.  
- DESCRIPTION → context about the lesson.  

Teaching Rules:
1. Always begin feedback by encouraging the student (e.g., “Good work!” or “Nice attempt!”).  
2. Explain what the code is doing **and why it matters** for the student’s specific goal or lesson context.  
3. Avoid just listing tags or syntax — connect them to real reasoning (e.g., “The <h1> tag is great for titles because it tells browsers and screen readers what’s most important”).  
4. Include at least one actionable suggestion to improve the code, style, or best practices.  
5. For every suggestion, briefly explain **why** that improvement matters (e.g., “This helps accessibility,” or “This makes the page load faster”).  
6. Use beginner-friendly language, short sentences, and a positive tone.  
7. Focus only on relevant code blocks (HTML/CSS/JS) according to subject rules.  
8. Ignore grammar, text content, and naming details (e.g., class, id, variable names).  

Output JSON Format:
{
  "feedback": "Brief, encouraging, and concept-based explanation of the student’s code — what was done well and why it’s correct or useful.",
  "suggestion": "One practical, beginner-friendly improvement or best practice that helps the student learn or code better, including a short reason why it matters."
}
        `,
      },
      {
        role: "user",
        content: `
Subject = "${subject}"
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
    return res.status(400).send({ message: "AI call failed" });
  }

  const reply = response.choices[0].message?.content;
  console.log("Lesson Prompt Response:", reply);

  return res.send({ response: reply });
};

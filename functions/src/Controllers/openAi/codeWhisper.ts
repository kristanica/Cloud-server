import { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export const codeWhisper = async (req: Request, res: Response) => {
  const {
    description,
    instruction,
    receivedCode,
    submittedCode,
  }: {
    description: string;
    instruction: string;
    receivedCode: any;
    submittedCode: any;
  } = req.body;

  const SubmittedCodeText =
    typeof submittedCode === "object"
      ? JSON.stringify(submittedCode, null, 2)
      : String(submittedCode || "");

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
System Message:
- You are an expert Frontend Developer specializing in HTML, CSS, JavaScript, and Database Querying.
- Your role is to provide the user with a *very vague hint* that helps them progress through the current stage.

GUIDELINES:
- Analyze the following inputs: 
  - INSTRUCTION → What the user is trying to achieve.
  - DESCRIPTION → The stage’s context or theme.
  - RECEIVEDCODE → The base or provided starter code.
  - SUBMITTEDCODE → The user’s current submitted attempt.
- Focus your hint on the *differences or potential mistakes* between RECEIVEDCODE and SUBMITTEDCODE.
- The hint should encourage reflection — not reveal the answer.
- Keep limit it to *1–2 short sentences*.
- Avoid direct fixes or exact code references.
- Never suggest creating files — DevLab already provides an editor.
- Ensure the hint is relevant to both the INSTRUCTION and the user’s SUBMITTEDCODE.

OUTPUT FORMAT:
Return your response strictly as JSON:
{
  "whisper": "A very vague hint that shall help the user on the current stage they are stuck in"
}


`,
      },
      {
        role: "user",
        content: `
Generate a very vague hint using these data 
DESCRIPTION: ${description}
INSTRUCTION: ${instruction}
RECIEVEDCODE: ${receivedCode}
SUBMITTEDCODE: ${SubmittedCodeText}
        `,
      },
    ],
  });

  if (!response) {
    return res.status(400).send({ message: "cant call" });
  }
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

  return res.status(200).json({ parsedResponse });
};

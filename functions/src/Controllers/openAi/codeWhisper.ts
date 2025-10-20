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
  }: { description: string; instruction: string; receivedCode: any } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
System Message:
- You are an expert Frontend Developer especially on fields such as HTML, CSS, JavaScript and Database Querying.
Your role is to help the user on the current stage by providing them a **VERY** vague hint that will help them progress through the stage.
NOTE: 
- Do NOT give full solutions.
- Only point toward errors, approaches, or the next logical step.
- Ensure that the generated hint is relevant to the instruction and description
- Make it kinda in a mysterious tone
- Keep it 1–2 short sentences.
- Do not suggest that the user shall create a file as devlab already provides them a code editor.

**IMPORTANT**
- HTML, CSS, JavaScript code blocks (may be empty if not used).  
- INSTRUCTIONS → what the student is trying to achieve.  
- DESCRIPTION → context


**Required JSON format:**
{
  whisper: "A very vague hint that shall help the user on the current stage they are stuck in"
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

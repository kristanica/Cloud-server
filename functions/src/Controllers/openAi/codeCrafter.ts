import { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import axios from "axios";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
export const codeCrafter = async (req: Request, res: Response) => {
  const { submittedCode, instruction, providedCode, description, subject } = req.body;

    let providedCodeText = "";
    if (providedCode) {
      // Fetch the raw code content from the URL
      const codeResponse = await axios.get(providedCode);
      providedCodeText = codeResponse.data;
    }

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
System Message
You are an Expert Full-Stack Developer and AI Evaluator specialized for CodeCrafter mode in DevLab.  
Your role is to act as a strict code reviewer whose purpose is to evaluate whether a user has **met the given instruction** using a provided reference code.

The user will be given:
- A provided code (PROVIDEDCODE) — a reference code snippet in HTML, CSS, JavaScript, or Database Query format. This may come from an inline code snippet or an external file displayed in an iframe.
- An instruction (INSTRUCTION) — a precise statement describing what the user must replicate or build.
- A description (DESCRIPTION) — optional extra context about the lesson.
- A Subject (SUBJECT) — specifies which language the code belongs to.

IMPORTANT:
- PROVIDEDCODE may not always be available. In such cases, evaluate the SUBMITTEDCODE solely based on the INSTRUCTION and DESCRIPTION.
- If PROVIDEDCODE is available, use it as a reference to help assess whether the instruction is satisfied.

The user’s task is to **replicate or create code that satisfies the instruction**. They may change structure, naming, and inner text content unless the instruction explicitly specifies otherwise.  
You must evaluate the SUBMITTEDCODE for:
- Adherence to INSTRUCTION.
- Syntax correctness.
- Structural integrity.
- Formatting and indentation.

General Rules (Apply to All Subjects):
1. Focus primarily on whether SUBMITTEDCODE meets INSTRUCTION, not just exact matching to PROVIDEDCODE.
2. Languages Supported: HTML, CSS, JavaScript, and Database Queries (SQL and NoSQL).
3. Ignore Unless Required by INSTRUCTION:
   - Differences in inner text content (capitalization, spacing, spelling, word choice).
   - Class, ID, or variable names (only check syntactic validity unless INSTRUCTION specifies otherwise).
   - Language-specific optional elements unless explicitly required.

VERY IMPORTANT RULE:
If SUBMITTEDCODE does not meet INSTRUCTION, respond with:
{
  "correct": false,
  "evaluation": "Incorrect",
  "feedback": "Instruction requirements not met."
}

PROMPT MESSAGE:
Evaluate the submitted code (SUBMITTEDCODE) based on INSTRUCTION using PROVIDEDCODE as a reference. PROVIDEDCODE may be inline code or the raw content of a file displayed in an iframe. Respond only in JSON format.

If correct:
- Output "Correct".
- In "feedback", explain why it is correct and provide one improvement suggestion.

If incorrect:
- Output "Incorrect".
- In "feedback", explain why it is incorrect and give a vague hint about what is wrong without providing full corrections.

STEPS FOR EVALUATION:
1. Compare SUBMITTEDCODE to PROVIDEDCODE and check against INSTRUCTION.
2. Check:
   - Whether INSTRUCTION is satisfied.
   - Syntax correctness.
   - Structural integrity.
   - Formatting and indentation.
3. Respond accordingly.

OUTPUT FORMAT
Your output must be a JSON object as follows:
{
  "correct": true/false,
  "evaluation": "Correct" or "Incorrect",
  "feedback": "Brief feedback why the code is correct or wrong",
  "PROVIDE": PROVIDEDCODE,
  "submitted": SUBMITTEDCODE,
}

Examples:

If correct:
{
  "correct": true,
  "evaluation": "Correct",
  "feedback": "The missing closing tag for <p> was fixed.",
"PROVIDE": PROVIDEDCODE,
"submitted": SUBMITTEDCODE,
}

If incorrect:
{
  "correct": false,
  "evaluation": "Incorrect",
  "feedback": "A closing tag is missing.",
"PROVIDE": PROVIDEDCODE,
"submitted": SUBMITTEDCODE,
}
`,
      },
      {
        role: "user",
        content: `
SUBMITTEDCODE = "${SubmittedCodeText}"
INSTRUCTION = "${instruction}"
PROVIDEDCODE = "${providedCodeText}"
DESCRIPTION = "${description}"
SUBJECT = "${subject}"
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

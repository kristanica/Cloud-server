import { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export const codeRushPrompts = async (req: Request, res: Response) => {
  const { submittedCode,instruction,providedCode, description,subject } = req.body;

const providedCodeText =
  typeof providedCode === "object"
    ? JSON.stringify(providedCode, null, 2)
    : String(providedCode || "");

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
You are an Expert Full-Stack Developer and AI Evaluator specialized for CodeRush mode in DevLab.  
Your role is to act as a strict code reviewer whose purpose is to evaluate whether a user has met the given instruction.

The user will be given:
- A provided code (PROVIDEDCODE) — a reference code snippet in HTML, CSS, JavaScript, or Database Query format (SQL or NoSQL).
- An instruction (INSTRUCTION) — a precise statement describing what the user must replicate or build.
- A description (DESCRIPTION) — optional extra context about the lesson.
- A Subject (SUBJECT) — specifies which language the code belongs to (HTML, CSS, JavaScript, Database Query).

IMPORTANT:
- PROVIDEDCODE may not always be available. In such cases, evaluate the SUBMITTEDCODE solely based on the INSTRUCTION and DESCRIPTION.
- If PROVIDEDCODE is available, use it as a reference to help assess whether the instruction is satisfied.
- Focus only on whether the submitted code meets the instruction and follows proper syntax.

The user’s task is to replicate or create code that satisfies the instruction.  
You must evaluate the SUBMITTEDCODE for:
- Adherence to INSTRUCTION.
- Syntax correctness.
- Structural integrity.
- Formatting and indentation.

General Rules:
1. Focus on whether SUBMITTEDCODE meets INSTRUCTION, not just exact matching to PROVIDEDCODE.
2. Languages Supported: HTML, CSS, JavaScript, Database Queries (SQL and NoSQL).
3. Ignore Unless Required by INSTRUCTION:
  - Differences in inner text content (capitalization, spacing, spelling, word choice).
  - Class, ID, or variable names (only check syntactic validity unless INSTRUCTION specifies otherwise).
  - Language-specific optional elements unless explicitly required.

Subject-Specific Rules
Html Rules
1. Doctype and Meta Tags
  - absence of <!DOCTYPE html>, <meta charset>, or <html lang="..."> is not incorrect unless INSTRUCTION requires them.
2. Style Attribute Quotes
  - Both single ' and double " quotes are valid inside style attributes.
  - Only mark incorrect if there are actual syntax errors (e.g., style="color="blue"").
3. Tag Closure Rules
  - HTML5 self-closing or optional tags (<br>, <img>, <input>, <meta>, <link>, <p>, <li>, <tr>, <td>) are valid.
  - <tag></tag> and <tag /> must be treated as equivalent in valid HTML5.
  - Only require explicit closure if INSTRUCTION demands it.

Css Rules
1. Syntax Validity
  - Each declaration must follow property: value;. Missing colons, semicolons, or braces are errors.
2. Case Insensitivity
  - CSS property names and values are case-insensitive. Do not mark errors for capitalization.
3. Units
  - Accept standard units (px, %, em, rem, vh, vw, etc.).
  - Consider omission of units invalid where required (e.g., width: 100; is incorrect).
4. Vendor Prefixes
  - Prefixed properties (-webkit-, -moz-) are valid if syntactically correct.

JavaScript Rules
1. Syntax & Structure
  - Check for unmatched braces, brackets, parentheses, or missing semicolons where required.
2. Quotes
  - Single ', double ", and backticks for template literals are all valid unless INSTRUCTION requires one specifically.
3. Variable/Function Names
  - Do not evaluate correctness of names unless INSTRUCTION specifies them.
4. Operators
  - Both == and === are valid unless INSTRUCTION requires strict or loose equality.
5. Output Methods
  - console.log, alert, or document.write are acceptable unless INSTRUCTION specifies one method.

Database Rules (SQL)
1. SQL Keywords
  - Case-insensitive (e.g., SELECT, select, SeLeCt all valid).
2. SQL Clause Order
  - Must follow correct order: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY ….
3. String Quotes
  - Both single ' and double " quotes are valid for string literals unless INSTRUCTION specifies otherwise.
4. Semicolons
  - Trailing semicolons are optional unless INSTRUCTION explicitly requires them.
5. Data Values
  - Ignore actual numbers or string content unless INSTRUCTION requires exact values.
Prompt:
Evaluate the submitted code (SUBMITTEDCODE) based on INSTRUCTION using PROVIDEDCODE as a reference. Respond only in JSON format.

Output format:
{
  "correct": true/false,
  "evaluation": "Correct" or "Incorrect",
  "feedback": "Brief feedback why the code is correct or wrong"
  "Submit" : SUBMITTEDCODE
}

Examples:
If correct:
{
  "correct": true,
  "evaluation": "Correct",
  "feedback": "The submitted code meets the instruction with proper structure and syntax."
  "Submit" : SUBMITTEDCODE
}
If incorrect:
{
  "correct": false,
  "evaluation": "Incorrect",
  "feedback": "A closing tag is missing, the CSS selector syntax is incorrect, or the query is not returning expected results."
  "Submit" : SUBMITTEDCODE
}`,
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

import { Request, Response } from "express";
import dotenv from "dotenv";

import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
export const lessonPrompt = async (req: Request, res: Response) => {
  const { instructions, description, css, js, html } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: ` 
        System message
You are a strict code reviewer AI.  Your only job is to respond with code blocks, syntax examples, or OS-level command snippets. 
If the user provides input that is not code, syntax, or OS snippets, do not explain, do not answer, and instead reply only with: "❌ Incorrect input. Please provide code."

Act as a Code reviewer who is an experienced developer in the given code language, which are HTML, CSS, JavaScript, and Database Querying. I will provide you with the code block , and I would like you to review the code and share the feedback and suggestions. Write explanations behind the feedback or suggestions. Reply in English using professional tone for everyone and make the reply direct to the point. For more context, note that you are being used to evaluate the code of students based on the lesson which is ${description}. 


INSTRUCTIONS: ${instructions}
System message
You are a strict code reviewer AI.  Your only job is to respond with code blocks, syntax examples, or OS-level command snippets. 
If the user provides input that is not code, syntax, or OS snippets, do not explain, do not answer, and instead reply only with: "❌ Incorrect input. Please provide code."

Act as a Code reviewer who is an experienced developer in the given code language, which are HTML, CSS, JavaScript, and Database Querying. I will provide you with the code block , and I would like you to review the code and share the feedback and suggestions. Write explanations behind the feedback or suggestions. Reply in English using professional tone for everyone and make the reply direct to the point. For more context, note that you are being used to evaluate the code of students based on the lesson which is ${description}. 

Prompt messages
	- Evaluate the code based on {{instruction}}.   
    - If any part of {{instruction}} is not met, the code is wrong. 
    - Do not recommend to expand the code for testing purposes. 
    - Make sure to point out these: if there are missing tags, example, if there is an opening tag but no closing tag; if semicolon, colon, comma, brackets, and other necessary symbols are missing; check if the usage of the syntaxes are right. 
    - If CSS or JS is empty, treat it as valid only if the lesson/instructions do not require them.

This is the block of code provided:
HTML: ${html}
CSS: ${css}
JavaScript: ${js}

Steps: 
1. Check whether code satisfies {{instruction}}.
2. If correct:
   - Provide a one-line confirmation: "Correct."
   - Provide brief feedback why it is correct.
   - Provide a suggestion to make the code better
3. If incorrect:
   - Provide only a one-line confirmation: "Incorrect".
   - Provide what syntax the user needs to use.

Output format in JSON:
"correct": true/false based if the code is correct or wrong,
"evaluation": Correct or Incorrect,
"feedback": Brief feedback why the code it correct or wrong,
"suggestion": Brief improvement advice related only to the INSTRUCTIONS`,
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

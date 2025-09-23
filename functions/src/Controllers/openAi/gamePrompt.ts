import { Request, Response } from "express";
import dotenv from "dotenv";

import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
export const gamePrompt = async (req: Request, res: Response) => {
  const { instructions, description, html, css, js } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: ` 
  System Message:
    Act as a Code reviewer who is an experienced developer in the given code language, which are HTML, CSS, JavaScript, and Database Querying. I will provide you with the code block , and I would like you to review the code and share the feedback and suggestions. Write explanations behind the feedback or suggestions. Reply in English using professional tone for everyone and make the reply direct to the point. For more context, note that you are being used to evaluate the code of students based on the lesson which is ${description}.

INSTRUCTIONS: ${instructions}

Prompt Message:
    - Evaluate the code based on INSTRUCTIONS.  
    - If any part of INSTRUCTIONS is not met, the code is wrong. Do not recommend to expand the code for testing purposes.  
    - If INSTRUCTIONS is requiring a comment and there are no comments on the submitted code, the code is wrong. If INSTRUCTIONS is not requiring comments, then the code is fine without comments. Do not show how to code it, just state what is missing and suggestions. Make sure to point out if there are missing tags, example, if there is an opening tag but no closing tag. 
    - If CSS or JS is empty, treat it as valid only if the lesson/instructions do not require them.
    - If the code is incorrect, just state that the code is incorrect, and provide a simple and vague hint on what to do. For example, if the code is missing a closing tag, say "a closing tag is missing", but do not say what tag is missing a closing tag. Do the same on other incorrect answers.

Steps: 
1. Check whether code satisfies INSTRUCTIONS.
2. If correct:
   - Provide a one-line confirmation: "Correct."
   - Provide brief feedback why it is correct.
   - Provide a suggestion to make the code better
   - Provide areas of improvement on how to make the code better
3. If incorrect:
   - Provide only a one-line confirmation: "Incorrect".
   - Also, provide a very vague hint.

This is the block of code provided:
HTML: ${html}
CSS: ${css}
JavaScript: ${js}

Output format in JSON:
"correct": true/false based if the code is correct or wrong,
"displayIfCorrect": State if the code is correct or wrong,
"feedback": Brief feedback why the code it correct or wrong,
"suggestion": Brief summary of suggestions but do not suggest what is not stated in INSTRUCTIONS`,
      },
    ],
  });
  if (!response) {
    return res.status(400).send({ message: "cant call" });
  }
  console.log(html);
  console.log(js);
  console.log(css);

  const reply = response.choices[0].message.content;
  console.log(reply);
  return res.send({ response: reply });
};

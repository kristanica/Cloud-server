import {Request, Response} from "express";
import dotenv from "dotenv";

import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
export const brainBytesPrompts = async (req: Request, res: Response) => {
  const {answer, instruction, description, a, b, c, d} = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "user",
        content: ` 
 System Message:
	Act as a Code reviewer who is an experienced developer in the given code language, which are HTML, CSS, JavaScript, and Database Querying. You are being used to check submitted answers in a multiple choice question which is based on ${instruction}. Reply in English using professional tone for everyone and make the reply direct to the point. For more context, the lesson is description is ${description}.

Prompt Message:
	Check if the submitted answer is correct based on ${answer}. Answers can only be between letters a, b, c, and d, any other answer is incorrect. One letter per answer only, multiple letter answer is incorrect. 

Steps for BrainBytes:
1. Check if the answer on the ${instruction} is correct based on the ${answer}.
The choices are:
${a} = a
${b} = b
${c} = c
${d} = d
2. If correct:
	- Provide a one-line confirmation: "Correct."
	- Provide a one sentence description for ${answer}.
3. If incorrect:
	- Provide only a one-line confirmation: "Incorrect". 
	- Provide a one sentence description for the incorrect answer.

Output format in JSON:
"correct": true/false based if the code is correct or wrong,
"evaluation": State if the code is correct or wrong,
"description": State the one sentence description for the answer.`,
      },
    ],
  });
  if (!response) {
    return res.status(400).send({message: "cant call"});
  }

  const reply = response.choices[0].message.content;
  console.log(reply);
  return res.send({response: reply});
};

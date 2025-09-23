import { Request, Response } from "express";
import dotenv from "dotenv";

import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
export const codeCrafter = async (req: Request, res: Response) => {
  const { submittedCode } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: ` 

Compre this userSubmitted code : ${submittedCode}
to this : <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Simple HTML Sample</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        color: #333;
        text-align: center;
        padding: 50px;
      }
      h1 {
        color: #ff69b4;
      }
      p {
        font-size: 18px;
      }
      button {
        padding: 10px 20px;
        font-size: 16px;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      button:hover {
        background-color: #2563eb;
      }
    </style>
  </head>
  <body>
    <h1>Welcome to My Sample Page</h1>
    <p>This is a simple HTML file with some basic styling and a button.</p>
    <button onclick="alert('Hello! You clicked the button.')">Click Me</button>
  </body>
</html>

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

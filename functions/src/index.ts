import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import openAiRoute from "./Routes/openAi";
import fireBaseRoute from "./Routes/fireBase";
import fireBaseAdminRoute from "./Routes/fireBaseAdmin";
import compression from "compression";
import puppeteer from "puppeteer";
// import * as functions from "firebase-functions/v2/https";
dotenv.config();
const PORT = process.env.PORT || 8082;
const corsOptions = {
  origin: "*",
}; // temporary, will switch to real URL when deployed

const app = express();
app.use(compression()); // Compresses files daw e
app.use(cors(corsOptions));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
// app.use(express.json());

app.use("/openAI", openAiRoute);
app.use("/fireBase", fireBaseRoute);

// app.post("/test", async (req: Request, res: Response) => {
//   try {
//     const { html } = req.body;
//     if (!html) {
//       return res.status(400).json({ error: "Missing HTML" });
//     }

//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();

//     await page.setContent(html, { waitUntil: "networkidle0" });

//     // Take screenshot as base64
//     const screenshotBuffer = await page.screenshot({ encoding: "base64" });

//     await browser.close();

//     // Send back JSON with the screenshot (you’ll later add SSIM here)
//     return res.status(200).json({
//       success: true,
//       screenshot: screenshotBuffer,
//       message: "Screenshot captured successfully 🎉",
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ error: "Something went wrong rendering HTML" });
//   }
// });

app.use("/fireBaseAdmin", fireBaseAdminRoute);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// export const api = functions.onRequest(app);
// sample lol, nag ppratice aq ng branching through GIT bash

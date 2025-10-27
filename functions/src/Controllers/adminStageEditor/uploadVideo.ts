import { Request, Response } from "express";
import { bucket, db } from "../../admin/admin";
import Busboy from "busboy";

export const uploadVideo = async (req: Request, res: Response) => {
  return new Promise<void>((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: 1024 * 1024 * 1024 * 2 }, // 2GB
    });

    let category = "";
    let lessonId = "";
    let levelId = "";
    let stageId = "";
    let fileBuffer: Buffer[] = [];
    let fileMimeType = "";
    let fileReceived = false;
    let responseSent = false;

    // Collect form fields
    busboy.on("field", (fieldname, value) => {
      if (fieldname === "category") category = value;
      if (fieldname === "lessonId") lessonId = value;
      if (fieldname === "levelId") levelId = value;
      if (fieldname === "stageId") stageId = value;
    });

    // Collect file data
    busboy.on("file", (fieldname, file, fileInfo) => {
      if (fieldname !== "video") {
        file.resume();
        return;
      }
      fileReceived = true;
      fileMimeType = fileInfo.mimeType;
      file.on("data", (chunk) => fileBuffer.push(chunk));
    });

    // Finish event
    busboy.on("finish", async () => {
      if (!fileReceived) {
        if (!responseSent) {
          responseSent = true;
          res.status(400).json({ error: "No video uploaded" });
          return resolve();
        }
      }

      if (!category || !lessonId || !levelId || !stageId) {
        if (!responseSent) {
          responseSent = true;
          res.status(400).json({
            error: "Missing required fields",
            received: { category, lessonId, levelId, stageId },
          });
          return resolve();
        }
      }

      try {
        const destination = `stageFiles/${category}/${lessonId}/${levelId}/${stageId}/video${stageId}.mp4`;
        const fileBucket = bucket.file(destination);
        const writeStream = fileBucket.createWriteStream({
          metadata: { contentType: fileMimeType },
          resumable: false, // important for small/medium videos
        });

        writeStream.end(Buffer.concat(fileBuffer));

        writeStream.on("finish", async () => {
          const [signedUrl] = await fileBucket.getSignedUrl({
            action: "read",
            expires: new Date("2030-03-01T00:00:00Z"),
          });

          const stageRef = db
            .collection(category)
            .doc(lessonId)
            .collection("Levels")
            .doc(levelId)
            .collection("Stages")
            .doc(stageId);

          await stageRef.set({ videoPresentation: signedUrl }, { merge: true });

          if (!responseSent) {
            responseSent = true;
            res.status(200).json({
              message: "Video uploaded successfully",
              url: signedUrl,
              path: destination,
            });
            resolve();
          }
        });

        writeStream.on("error", (err) => {
          console.error("Upload error:", err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ error: err.message });
            reject(err);
          }
        });
      } catch (err) {
        console.error("Unexpected error:", err);
        if (!responseSent) {
          responseSent = true;
          res.status(500).json({ error: (err as any).message });
          reject(err);
        }
      }
    });

    busboy.on("error", (err: any) => {
      console.error("Busboy error:", err);
      if (!responseSent) {
        responseSent = true;
        res.status(500).json({ error: err.message });
        reject(err);
      }
    });

    req.pipe(busboy);
  });
};

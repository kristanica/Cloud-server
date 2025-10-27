import { Request, Response } from "express";
import { bucket, db } from "../../admin/admin";
import Busboy from "busboy";
import { uploadBufferToStorage } from "../nativeExclusive/uploadBufferToStorage";

export const uploadFile = async (req: Request, res: Response) => {
  return new Promise<void>((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });

    let category = "";
    let lessonId = "";
    let levelId = "";
    let stageId = "";
    let fileBuffer: Buffer[] = [];
    let fileMimeType = "";
    let fileReceived = false;
    let responseSent = false;

    // Collect fields
    busboy.on("field", (fieldname, value) => {
      if (fieldname === "category") category = value;
      if (fieldname === "lessonId") lessonId = value;
      if (fieldname === "levelId") levelId = value;
      if (fieldname === "stageId") stageId = value;
    });

    // Collect file in buffer
    busboy.on("file", (fieldname, file, fileInfo) => {
      fileReceived = true;
      fileMimeType = fileInfo.mimeType;
      file.on("data", (chunk) => fileBuffer.push(chunk));
    });

    busboy.on("finish", async () => {
      if (!fileReceived) {
        if (!responseSent) {
          responseSent = true;
          res.status(400).json({ error: "No file uploaded" });
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
        const destination = `stageFiles/${category}/${lessonId}/${levelId}/${stageId}/replicationFile${stageId}.html`;
        const fileBufferConcat = Buffer.concat(fileBuffer);

        // Use your utility to upload buffer to Firebase Storage
        await uploadBufferToStorage(
          fileBufferConcat,
          destination,
          fileMimeType
        );

        // Get signed URL
        const [signedUrl] = await bucket.file(destination).getSignedUrl({
          action: "read",
          expires: new Date("2030-03-01T00:00:00Z"),
        });

        // Update Firestore
        const stageRef = db
          .collection(category)
          .doc(lessonId)
          .collection("Levels")
          .doc(levelId)
          .collection("Stages")
          .doc(stageId);

        await stageRef.set({ replicationFile: signedUrl }, { merge: true });

        if (!responseSent) {
          responseSent = true;
          res.status(200).json({
            message: "File uploaded successfully",
            url: signedUrl,
            path: destination,
          });
          resolve();
        }
      } catch (err) {
        console.error("Upload / Firestore error:", err);
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

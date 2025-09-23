import { Request, Response } from "express";
import { bucket, db } from "../../admin/admin";
export const uploadFile = async (req: Request, res: Response) => {
  const { category, lessonId, levelId, stageId } = req.body as {
    category: string;
    lessonId: string;
    levelId: string;
    stageId: string;
  };
  const stageRef = db
    .collection(category)
    .doc(lessonId)
    .collection("Levels")
    .doc(levelId)
    .collection("Stages")
    .doc(stageId);
  const destination = `stageFiles/${category}/${lessonId}/${levelId}/${stageId}/replicationFile${stageId}.html`; // location of the video
  const file = bucket.file(destination);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  console.log(req.file);

  try {
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
      resumable: true,
    });
    console.log("sana nag save");
  } catch (error) {
    console.log(error);
  }

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: new Date("2030-03-01T00:00:00Z"),
  });

  await stageRef.set(
    {
      replicationFile: signedUrl,
    },
    {
      merge: true,
    }
  );
  return res.status(200).json({
    message: "File has been successfully added",
    url: signedUrl,
    path: destination,
  });
};

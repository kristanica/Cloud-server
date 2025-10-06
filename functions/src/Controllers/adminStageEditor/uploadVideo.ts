import { Request, Response } from "express";
import { bucket, db } from "../../admin/admin";
export const uploadVideo = async (req: Request, res: Response) => {
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
  const destination = `stageFiles/${category}/${lessonId}/${levelId}/${stageId}/video${stageId}video.mp4`; // location of the video
  const file = bucket.file(destination);

  // accesss the video using req.file

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  await file.save(req.file.buffer, {
    // saves the video to fire storage
    metadata: {
      contentType: req.file.mimetype, // takes in the type of the file from form data (i.e vieo/mp4)
    },
    resumable: true,
  });
  // Might still change
  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2030",
  });
  // sets the uri for the stage
  await stageRef.set(
    {
      videoPresentation: signedUrl,
    },
    {
      merge: true,
    }
  );
  return res.status(200).json({
    message: "Video uploaded successfully",
    url: signedUrl,
    path: destination,
  });
};

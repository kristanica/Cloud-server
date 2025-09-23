import { Request, Response } from "express";
import { bucket, db } from "../../admin/admin";

const uploadImage = async (req: Request, res: Response) => {
  const { category, lessonId, levelId, stageId } = req.body as {
    category: string;
    lessonId: string;
    levelId: string;
    stageId: string;
  };
  console.log("fireBaseAdminRoute received:", req.method, req.originalUrl);
  try {
    const stageRef = db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .collection("Stages")
      .doc(stageId);
    const destination = `stageFiles/${category}/${lessonId}/${levelId}/${stageId}/ReplicatePhoto${stageId}.jpg`; // location of the image
    const file = bucket.file(destination);

    // access the image using req.file

    if (!req.file?.buffer) {
      return res.status(400).json({ message: "No image buffer provided" });
    }
    // Stores image into file storage
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
      resumable: false,
    });

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    // sets the uri for the stage
    await stageRef.set(
      {
        imageReplication: signedUrl,
      },
      {
        merge: true,
      }
    );

    return res.status(200).json({ message: "Image has been set" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Something went wrong with uploading an image" });
  }
};
export default uploadImage;

import { Request, Response } from "express";
import { bucket, db } from "../../admin/admin";
import { getFirestore } from "firebase-admin/firestore";

export const deleteLevel = async (req: Request, res: Response) => {
  const { category, lessonId, levelId } = req.body as {
    category: string;
    lessonId: string;
    levelId: string;
  };

  try {
    const levelRef = db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId);
    const filePath = `stageFiles/${category}/${lessonId}/${levelId}`;
    const [files] = await bucket.getFiles({ prefix: filePath });
    if (files.length > 0) {
      const deleteFiles = files.map((file) => file.delete());
      await Promise.all(deleteFiles);
    }

    const userCollection = await db.collection("Users").get();

    userCollection.docs.forEach(async (userDoc, index) => {
      const progressRef = userDoc.ref
        .collection("Progress")
        .doc(category)
        .collection("Lessons")
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId);

      await getFirestore().recursiveDelete(progressRef);
    });
    // MAY GANTO PALA PUTANGINA?

    await getFirestore().recursiveDelete(levelRef);

    return res.status(200).json({
      message: `Level ${levelId} and its related data deleted successfully.`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Something went wrong when deleting ${levelId}` });
  }
};

import { getFirestore } from "firebase-admin/firestore";
import { bucket, db } from "../../admin/admin";

import { Response } from "express";
export const deleteStage = async (req: any, res: Response) => {
  const { category, lessonId, levelId, stageId } = req.body as {
    category: string;
    lessonId: string;
    levelId: string;
    stageId: string;
  };
  const id = req.user?.uid;
  console.log(id);
  try {
    const specificStageRef = db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .collection("Stages")
      .doc(stageId);

    await specificStageRef.delete();

    const stageRef = db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .collection("Stages");

    const queryByOrder = stageRef.orderBy("order", "asc");
    const snapShot = await queryByOrder.get();
    const batch = db.batch();

    const filePath = `stageFiles/${category}/${lessonId}/${levelId}/${stageId}`;
    const [files] = await bucket.getFiles({ prefix: filePath });
    const deleteFiles = files.map((file) => file.delete());
    await Promise.all(deleteFiles);

    const userCollection = await db.collection("Users").get();

    userCollection.docs.forEach(async (userDoc, index) => {
      const progressRef = userDoc.ref
        .collection("Progress")
        .doc(category)
        .collection("Lessons")
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId)
        .collection("Stages")
        .doc(stageId);
      await getFirestore().recursiveDelete(progressRef);
    });

    snapShot.docs.forEach((queryDoc, index) => {
      batch.update(queryDoc.ref, {
        order: index + 1,
      });
    });

    await batch.commit();

    return res.status(200).json({
      message: "Stage has been deleted and all stages have been reordered",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Something when wrong when deleting" + error });
  }
};

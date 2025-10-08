import { Request, Response } from "express";
import { db } from "../admin/admin";
import { FieldPath } from "firebase-admin/firestore";

export const gameOver = async (req: Request, res: Response) => {
  const {
    id,
    category,
    lessonId,
    levelId,
  }: {
    id: string;
    category: string;
    lessonId: string;
    levelId: string;
  } = req.body;
  console.log("Received body:", req.body);

  try {
    const userRef = db.collection("Users").doc(id);
    if (!(await userRef.get()).exists) {
      return res.status(404).json({ message: "User not found" });
    }
    const resetRef = db
      .collection("Users")
      .doc(id)
      .collection("Progress")
      .doc(category)
      .collection("Lessons")
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .collection("Stages")
      .where(FieldPath.documentId(), "!=", "Stage1");

    const batch = db.batch();

    const resetRefSnapShot = await resetRef.get();

    resetRefSnapShot.docs.forEach((docSnap) => {
      console.log("Deleting:", docSnap.id, docSnap.data());
      batch.delete(docSnap.ref);
    });

    await batch.commit();

    console.log("ASDSAD");

    return res.status(200).json({
      message:
        "The user has lost all their lives and thus resulting into resetting of progress",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Somehting went wrong when resetting user progress" });
  }
};

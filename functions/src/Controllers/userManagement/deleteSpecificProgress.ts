import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../admin/admin";
import { Request, Response } from "express";

export const deleteSpecificProgress = async (req: Request, res: Response) => {
  try {
    const { uid, subject }: { uid: string; subject: string } = req.body;

    const lessonRef = db
      .collection("Users")
      .doc(uid)
      .collection("Progress")
      .doc(subject)
      .collection("Lessons");

    const lessonSnap = await lessonRef.get();

    const batch = db.batch();
    //Rresets stasges
    for (const lessonDoc of lessonSnap.docs) {
      batch.update(lessonDoc.ref, {
        isLessonUnlocked: lessonDoc.id === "Lesson1" ? true : false,
      });
      const levelSnap = await lessonDoc.ref.collection("Levels").get();

      for (const levelDoc of levelSnap.docs) {
        batch.update(levelDoc.ref, {
          isActive: levelDoc.id === "Level1" ? true : false,
          isCompletedAt:
            levelDoc.id === "Level1" ? new Date() : FieldValue.delete(),
          dateUnlocked: FieldValue.delete(),
          isCompleted: false,
          isRewardClaimed: false,
        });
        const stageSnap = await levelDoc.ref.collection("Stages").get();

        // resets stages per level
        for (const stageDoc of stageSnap.docs) {
          batch.update(stageDoc.ref, {
            completedAt: FieldValue.delete(),
            dateUnlocked:
              stageDoc.id === "Stage1" ? new Date() : FieldValue.delete(),
            isActive: stageDoc.id === "Stage1" ? true : false,
            isCompleted: stageDoc.id === "Stage1" ? true : false,
          });
        }
      }
    }
    await batch.commit();
    return res.status(200).json({ message: "succesful reset" });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong when unlocking next stage/level/lesson",
      error: error instanceof Error ? error.message : error,
    });
  }
};

import { Request, Response } from "express";
import { db } from "../../admin/admin";
import { FieldValue } from "firebase-admin/firestore";

export const deleteAllProgress = async (req: Request, res: Response) => {
  try {
    const { uid }: { uid: string } = req.body;
    const subjects = ["Html", "Css", "JavaScript", "Database"];

    const userRef = db.collection("Users").doc(uid);

    for (const subject of subjects) {
      const lessonsRef = userRef
        .collection("Progress")
        .doc(subject)
        .collection("Lessons");

      const lessonSnap = await lessonsRef.get();

      for (const lessonDoc of lessonSnap.docs) {
        if (lessonDoc.id !== "Lesson1") {
          //  Recursively delete all other lessons & their subcollections
          await db.recursiveDelete(lessonDoc.ref);
        } else {
          //  Reset Lesson1
          await lessonDoc.ref.set(
            {
              isLessonUnlocked: true,
              isCompleted: false,
              completedAt: FieldValue.delete(),
            },
            { merge: true }
          );

          const levelSnap = await lessonDoc.ref.collection("Levels").get();
          for (const levelDoc of levelSnap.docs) {
            if (levelDoc.id !== "Level1") {
              await db.recursiveDelete(levelDoc.ref);
            } else {
              //  Reset Level1
              await levelDoc.ref.set(
                {
                  isActive: true,
                  isCompleted: false,
                  isRewardClaimed: false,
                  completedAt: FieldValue.delete(),
                  dateUnlocked: new Date(),
                },
                { merge: true }
              );

              const stageSnap = await levelDoc.ref.collection("Stages").get();
              for (const stageDoc of stageSnap.docs) {
                if (stageDoc.id !== "Stage1") {
                  await db.recursiveDelete(stageDoc.ref);
                } else {
                  //  Reset Stage1
                  await stageDoc.ref.set(
                    {
                      isActive: true,
                      isCompleted: true, // user starts fresh
                      dateUnlocked: new Date(),
                      completedAt: FieldValue.delete(),
                    },
                    { merge: true }
                  );
                }
              }
            }
          }
        }
      }

      //  Remove lastOpenedLevel entry for this subject
      await userRef.update({
        [`lastOpenedLevel.${subject}`]: FieldValue.delete(),
      });
    }

    return res.status(200).json({
      message: "All user progress successfully reset across all subjects",
    });
  } catch (error) {
    console.error(" Error in deleteAllProgress:", error);
    return res.status(500).json({
      message: "Something went wrong while resetting all progress",
      error: error instanceof Error ? error.message : error,
    });
  }
};

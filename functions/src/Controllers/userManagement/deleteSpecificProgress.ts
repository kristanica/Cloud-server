import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../admin/admin";
import { Request, Response } from "express";

export const deleteSpecificProgress = async (req: Request, res: Response) => {
  try {
    const { uid, subject }: { uid: string; subject: string } = req.body;

    const userRef = db.collection("Users").doc(uid);
    const lessonsRef = userRef
      .collection("Progress")
      .doc(subject)
      .collection("Lessons");

    const lessonSnap = await lessonsRef.get();

    for (const lessonDoc of lessonSnap.docs) {
      if (lessonDoc.id !== "Lesson1") {
        //  Recursively delete all other lessons & subcollections
        await db.recursiveDelete(lessonDoc.ref);
      } else {
        //  Keep Lesson1 but reset it
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
            //  Delete all other levels and their subcollections
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
                await stageDoc.ref.set(
                  {
                    isActive: true,
                    isCompleted: true, //  reset Stage1 progress too
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

    //  Remove the lastOpenedLevel entry for this subject
    await userRef.update({
      [`lastOpenedLevel.${subject}`]: FieldValue.delete(),
    });

    return res.status(200).json({
      message: `User progress for ${subject} has been fully reset`,
    });
  } catch (error) {
    console.error(" Error in deleteSpecificProgress:", error);
    return res.status(500).json({
      message: "Something went wrong during reset",
      error: error instanceof Error ? error.message : error,
    });
  }
};

import express, { Request, Response } from "express";
import { middleWare } from "../Middleware/middleWare";

import { db } from "../admin/admin";
import * as admin from "firebase-admin";
import { fetchLesson } from "../Controllers/user/fetchLesson";
import { fetchAchievements } from "../Controllers/user/fetchAchievements";
import { activeLevels } from "../Controllers/user/activeLevels";
interface IUserRequest extends express.Request {
  user?: any;
}
const fireBaseRoute = express();

// Gets all stages within specific category, lesson and level
// Native Specific

fireBaseRoute.get("/getLesson/:category", middleWare, fetchLesson);

fireBaseRoute.get(
  "/getSpecificStage/:category/:lessonId/:levelId",
  middleWare,
  async (req: Request, res: Response) => {
    try {
      const { category, lessonId, levelId } = req.params;
      const stagesRef = db
        .collection(category)
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId)
        .collection("Stages");
      const queryByOrder = stagesRef.orderBy("order");

      const queriedData = await queryByOrder.get();
      const allStages = queriedData.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as {
          isHidden: boolean;
          order: number;
          codingInterface?: string;
          description: string;
          instruction: string;
          title: string | undefined | null;
        }),
      }));
      return res.status(200).json(allStages);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Failed to fetch the stages " + error });
    }
  }
);

// Purchasing an item.
// // Not final, might switch to transaction to prevent race conditions
// fireBaseRoute.post(
//   "/purchaseItem",
//   middleWare,
//   async (req: IUserRequest, res: Response) => {
//     const uid = req.user?.uid; // userid
//     const { itemId, itemCost, itemName } = req.body;
//     // Can pass the user's currency in the body instead, but might stick to this.
//     try {
//       const userRef = db.collection("Users").doc(uid); // queries user data
//       const userSnap = await userRef.get();
//       if (!userSnap.exists) {
//         return res.status(404).json({ message: "User does not exist" });
//       }

//       const userData = userSnap.data();

//       if (userData?.coins < itemCost) {
//         return res.status(401).json({ message: "Not enough coins" });
//       }
//       // Update's user coins on firebase
//       await userRef.update({
//         coins: admin.firestore.FieldValue.increment(-Number(itemCost)),
//       });

//       const inventoryRef = db
//         .collection("Users")
//         .doc(uid)
//         .collection("Inventory")
//         .doc(itemId);

//       const inventorySnap = await inventoryRef.get();

//       if (inventorySnap.exists) {
//         await inventoryRef.update({
//           quantity: admin.firestore.FieldValue.increment(1),
//           Icon: itemName || "",
//           title: itemName.replace("_Icon.png", ""),
//         });
//       } else {
//         await inventoryRef.set({
//           quantity: 1,
//           Icon: itemName || "",
//           title: itemName.replace("_Icon.png", ""),
//         });
//       }

//       return res.status(200).json({
//         message: "sucess on purchasing item",
//         newCoins: userData?.coins - itemCost,
//       }); // returns the new coins for displaying
//     } catch (error) {
//       return res
//         .status(500)
//         .json({ message: "Failed when purchasing an item" });
//     }
//   }
// );

fireBaseRoute.post(
  "/purchaseItem",
  middleWare,
  async (req: IUserRequest, res: Response) => {
    const uid = req.user?.uid; // userid
    const { itemId, itemCost, itemName } = req.body;
    // Can pass the user's currency in the body instead, but might stick to this.
    try {
      const userRef = db.collection("Users").doc(uid); // queries user data
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        return res.status(404).json({ message: "User does not exist" });
      }

      const userData = userSnap.data();

      if (userData?.coins < itemCost) {
        return res.status(401).json({ message: "Not enough coins" });
      }
      // Update's user coins on firebase
      await userRef.update({
        coins: admin.firestore.FieldValue.increment(-Number(itemCost)),
      });

      const inventoryRef = db
        .collection("Users")
        .doc(uid)
        .collection("Inventory")
        .doc(itemId);

      const inventorySnap = await inventoryRef.get();

      if (inventorySnap.exists) {
        await inventoryRef.update({
          quantity: admin.firestore.FieldValue.increment(1),
          Icon: itemName || "",
          title: itemName.replace("_Icon.png", ""),
        });
      } else {
        await inventoryRef.set({
          quantity: 1,
          Icon: itemName || "",
          title: itemName.replace("_Icon.png", ""),
        });
      }

      return res.status(200).json({
        message: "sucess on purchasing item",
        newCoins: userData?.coins - itemCost,
      }); // returns the new coins for displaying
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Failed when purchasing an item" });
    }
  }
);
// get specific user information
// Might be used on usermanagement
fireBaseRoute.get(
  "/getSpecificUser/:uid",
  middleWare,
  async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;

      const userRef = db.collection("Users").doc(uid);

      const userData = await userRef.get();

      if (!userData.exists) {
        return res.status(400).json({ message: "This user does not exist" });
      }
      return res.status(200).json(userData.data());
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message:
          "Something went wrong when fetching this specified user's data",
      });
    }
  }
);

fireBaseRoute.get(
  "/userProgres/:subject",
  middleWare,
  async (req: IUserRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      const { subject } = req.params;
      const allProgress: any = {};
      const allStages: any = {};
      const allStagesComplete: any = {};
      let completedLevels = 0;
      let completedStages = 0;
      const lessonRef = await db.collection(subject).get();
      for (const lessonTemp of lessonRef.docs) {
        const lessonId = lessonTemp.id;
        const levelsDoc = await db
          .collection("Users")
          .doc(uid)
          .collection("Progress")
          .doc(subject)
          .collection("Lessons")
          .doc(lessonId)
          .collection("Levels")
          .get();
        for (const levelsTemp of levelsDoc.docs) {
          const levelId = levelsTemp.id;
          const isActive: boolean = levelsTemp.data().isActive;
          const isRewardClaimed: boolean = levelsTemp.data().isRewardClaimed;
          const dateUnlocked: Date = levelsTemp.data().dateUnlocked;
          const isCompleted: boolean = levelsTemp.data().isCompleted;
          const completedAt: Date = levelsTemp.data().completedAt;

          // gets the status for each levels per specific user
          allProgress[`${lessonId}-${levelId}`] = {
            isActive: isActive,
            isRewardClaimed: isRewardClaimed,
            dateUnlocked: dateUnlocked,
            isCompleted: isCompleted,
            completedAt: completedAt,
          };

          if (isCompleted === true) completedLevels += 1;

          const stagesDoc = await db
            .collection("Users")
            .doc(uid)
            .collection("Progress")
            .doc(subject)
            .collection("Lessons")
            .doc(lessonId)
            .collection("Levels")
            .doc(levelId)
            .collection("Stages")
            .get();

          stagesDoc.forEach((stagesTemp) => {
            const isStageActive: boolean = stagesTemp.data().isActive;
            const isStageCompleted: boolean = stagesTemp.data().isCompleted;
            const dateUnlockStage: Date = stagesTemp.data().dateUnlocked;
            const stageCompletedAt: Date = stagesTemp.data().completedAt;
            allStages[`${lessonId}-${levelId}-${stagesTemp.id}`] = {
              isActive: isStageActive,
              isCompleted: isStageCompleted,
              dateUnlocked: dateUnlockStage,
              completedAt: stageCompletedAt,
            };
            if (isStageActive === true) completedStages += 1;
          });
          stagesDoc.forEach((stagesTemp) => {
            const stageStatus = stagesTemp.data().isCompleted;
            allStagesComplete[`${lessonId}-${levelId}-${stagesTemp.id}`] =
              stageStatus;
            if (stageStatus === true) completedStages += 1;
          });
        }
      }
      return res.status(200).json({
        allProgress,
        allStages,
        completedLevels,
        completedStages,
        allStagesComplete,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Something went wrong when fetching user progress" + error,
      });
    }
  }
);
// Get's all the data per category
// Web Specific
fireBaseRoute.get(
  "/getAllData/:subject",
  middleWare,
  async (req: Request, res: Response) => {
    try {
      const { subject } = req.params;

      const lessonRef = db.collection(subject);

      const lessonSnapShot = await lessonRef.get();

      const lesson = await Promise.all(
        lessonSnapShot.docs.map(async (lessonDoc) => {
          const levelsRef = db
            .collection(subject)
            .doc(lessonDoc.id)
            .collection("Levels");

          const levelSnapShot = await levelsRef.get();

          const levels = await Promise.all(
            levelSnapShot.docs.map(async (levelDoc) => {
              const stagesRef = db
                .collection(subject)
                .doc(lessonDoc.id)
                .collection("Levels")
                .doc(levelDoc.id)
                .collection("Stages");

              const stagesSnapShot = await stagesRef.get();
              const stages = stagesSnapShot.docs.map((stageDoc) => ({
                id: stageDoc.id,
                ...stageDoc.data(), // Gets all the stages
              }));

              return {
                id: levelDoc.id,
                ...levelDoc.data(), // gets all the level
                stages,
              };
            })
          );
          return {
            id: lessonDoc.id,
            ...lessonDoc.data(), // gets all the lessons
            levels,
          };
        })
      );

      // finally returns it as a bulk
      return res.status(200).json(lesson);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Somethign went wrong when fetching the lesson " + error,
      });
    }
  }
);

// Fetches all Shop items
fireBaseRoute.get("/Shop", middleWare, async (req: Request, res: Response) => {
  try {
    const shopSnapShot = await db.collection("Shop").get();

    if (shopSnapShot.empty) {
      return res.status(404).json({ message: "No shop items found" });
    }
    const itemList = shopSnapShot.docs.map((shopTemp) => ({
      id: shopTemp.id,
      ...shopTemp.data(),
    })); // queries all the shop items

    return res.status(200).json(itemList);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Something went wrong when fetchng shop" });
  }
});

// Unlock next stage
// Unlock next stage
fireBaseRoute.post(
  "/unlockStage",
  middleWare,
  async (req: IUserRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      const { subject, lessonId, levelId, stageId } = req.body;

      if (!uid || !subject || !lessonId || !levelId || !stageId) {
        return res.status(400).json({
          message: "Missing required parameters",
          uid,
          subject,
          lessonId,
          levelId,
          stageId,
        });
      }

      const stageRefPlaceHolder = db
        .collection("Users")
        .doc(uid)
        .collection("Progress")
        .doc(subject)
        .collection("Lessons")
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId)
        .collection("Stages");

      const stageRef = db
        .collection(subject)
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId)
        .collection("Stages")
        .doc(stageId);

      const currentStageData = (await stageRef.get()).data();
      const currentStageOrder = currentStageData?.order;

      if (currentStageOrder === undefined) {
        return res.status(400).json({
          message: "Stage is missing 'order' field",
        });
      }

      const nextStageQuery = await db
        .collection(subject)
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId)
        .collection("Stages")
        .where("order", ">", currentStageOrder)
        .orderBy("order")
        .limit(1)
        .get();

      const isLastStageOfLevel = nextStageQuery.empty; // <-- check if last stage!nextLevelQuery.empty of current level

      // ----------------------------
      // Handle next stage unlock
      // ----------------------------
      if (!nextStageQuery.empty) {
        const nextStageDoc = nextStageQuery.docs[0];
        const nextStageId = nextStageDoc.id;
        const nextStageType = nextStageDoc.data()?.type || null;

        // mark current stage as completed
        const currentStageRef = stageRefPlaceHolder.doc(stageId);
        await currentStageRef.set(
          {
            isCompleted: true,
            completedAt: new Date(),
          },
          { merge: true }
        );

        // unlock next stage (special case for Stage1)
        const nextStageRef = stageRefPlaceHolder.doc(nextStageId);
        const nextStageSnap = await nextStageRef.get();

        if (!nextStageSnap.exists) {
          await nextStageRef.set(
            {
              isActive: true,
              isCompleted: nextStageId === "Stage1",
              dateUnlocked: new Date(),
            },
            { merge: true }
          );
        } else {
          const nextStageData = nextStageSnap.data();
          if (nextStageData?.isCompleted !== true) {
            await nextStageRef.set(
              {
                isActive: true,
                isCompleted:
                  nextStageId === "Stage1"
                    ? true
                    : nextStageData?.isCompleted || false,
                dateUnlocked: nextStageData?.dateUnlocked || new Date(),
              },
              { merge: true }
            );
          }
        }

        return res.status(200).json({
          message: "Next stage unlocked",
          nextStageId,
          nextStageType,
          isNextStageUnlocked: true,
        });
      }

      // ----------------------------
      // Handle next level unlock
      // ----------------------------
      const currentLevelOrder = (
        await db
          .collection(subject)
          .doc(lessonId)
          .collection("Levels")
          .doc(levelId)
          .get()
      ).data()?.levelOrder;

      if (currentLevelOrder === undefined) {
        return res.status(400).json({
          message: "Level is missing 'levelOrder' field",
        });
      }

      const nextLevelQuery = await db
        .collection(subject)
        .doc(lessonId)
        .collection("Levels")
        .where("levelOrder", ">", currentLevelOrder)
        .orderBy("levelOrder")
        .limit(1)
        .get();

      const levelRefPlaceHolder = db
        .collection("Users")
        .doc(uid)
        .collection("Progress")
        .doc(subject)
        .collection("Lessons")
        .doc(lessonId)
        .collection("Levels");

      const currentLevelRef = levelRefPlaceHolder.doc(levelId);

      // Always mark last stage as completed
      const lastStageRef = stageRefPlaceHolder.doc(stageId);
      await lastStageRef.set(
        {
          isCompleted: true,
          completedAt: new Date(),
        },
        { merge: true }
      );

      // Always mark current level as completed if last stage
      if (isLastStageOfLevel) {
        await currentLevelRef.set(
          {
            isRewardClaimed: true,
            isCompleted: true,
            completedAt: new Date(),
          },
          { merge: true }
        );
      }

      if (!nextLevelQuery.empty) {
        const nextLevelDoc = nextLevelQuery.docs[0];
        const nextLevelId = nextLevelDoc.id;

        const nextLevelRef = levelRefPlaceHolder.doc(nextLevelId);
        const nextLevelSnap = await nextLevelRef.get();

        if (!nextLevelSnap.exists) {
          // Only create if it doesn't exist
          await nextLevelRef.set(
            {
              isActive: true,
              isRewardClaimed: false,
              dateUnlocked: new Date(),
              isCompleted: false,
            },
            { merge: true }
          );
        }

        // auto-complete Stage1 on next level if not exist
        const nextStageRef = nextLevelRef.collection("Stages").doc("Stage1");
        const nextStageSnap = await nextStageRef.get();
        if (!nextStageSnap.exists) {
          await nextStageRef.set(
            {
              isActive: true,
              isCompleted: true,
              dateUnlocked: new Date(),
            },
            { merge: true }
          );
        }

        return res.status(200).json({
          message: "Next level unlocked",
          nextLevelId,
          isNextLevelUnlocked: true,
        });
      }

      // ----------------------------
      // Handle next lesson unlock
      // ----------------------------
      const currentLessonOrder = (
        await db.collection(subject).doc(lessonId).get()
      ).data()?.Lesson;

      if (currentLessonOrder === undefined) {
        return res.status(400).json({
          message: "Lesson is missing 'Lesson' order field",
        });
      }

      const nextLessonQuery = await db
        .collection(subject)
        .where("Lesson", ">", currentLessonOrder)
        .orderBy("Lesson")
        .limit(1)
        .get();

      if (!nextLessonQuery.empty) {
        const nextLessonDoc = nextLessonQuery.docs[0];
        const nextLessonId = nextLessonDoc.id;

        const nextLessonRef = db
          .collection("Users")
          .doc(uid)
          .collection("Progress")
          .doc(subject)
          .collection("Lessons")
          .doc(nextLessonId);

        await nextLessonRef.set({ isLessonUnlocked: true }, { merge: true });

        const nextLevelRef = nextLessonRef.collection("Levels").doc("Level1");
        await nextLevelRef.set(
          {
            isActive: true,
            isRewardClaimed: false,
            dateUnlocked: new Date(),
            isCompleted: false,
          },
          { merge: true }
        );

        // auto-complete Stage1 on new lesson
        const nextStageRef = nextLevelRef.collection("Stages").doc("Stage1");
        await nextStageRef.set(
          {
            isActive: true,
            isCompleted: true,
            dateUnlocked: new Date(),
            status: true,
          },
          { merge: true }
        );
        const lastLevel = levelRefPlaceHolder.doc(levelId);
        const lastStage = stageRefPlaceHolder.doc(stageId);
        const lastLesson = db
          .collection("Users")
          .doc(uid)
          .collection("Progress")
          .doc(subject)
          .collection("Lessons")
          .doc(lessonId);
        await lastLesson.set(
          { isCompleted: true, completedAt: new Date() },
          { merge: true }
        );
        await lastLevel.set(
          {
            isRewardClaimed: true,
            isCompleted: true,
            completedAt: new Date(),
          },
          { merge: true }
        );

        await lastStage.set(
          {
            isCompleted: true,
            completedAt: new Date(),
          },
          { merge: true }
        );

        return res.status(200).json({
          message: "Next lesson unlocked",
          nextLessonId,
          isNextLessonUnlocked: true,
        });
      }

      // ----------------------------
      // Handle last lesson / last level / last stage
      // ----------------------------

      // Optional: mark lesson completed

      return res.status(200).json({
        message: `${subject} has been completed!`,
        isWholeTopicFinished: true,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Something went wrong when unlocking next stage/level/lesson",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
);

// Return type for level progress
type allProgressType = Record<
  string,
  Record<
    string,
    {
      isActive: boolean;
      isRewardClaimed: boolean;
      dateUnlocked: Date;
      isCompleted: boolean;
      completedAt: Date;
    }
  >
>;
// Return type for stage progress
type allStagesType = Record<
  string,
  Record<
    string,
    {
      isActive: boolean;
      isCompleted: boolean;
      dateUnlocked: Date;

      completedAt: Date;
    }
  >
>;

fireBaseRoute.get(
  "/userProgress",
  middleWare,
  async (req: IUserRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      console.log(uid);
      const allProgress: allProgressType = {};
      const allStages: allStagesType = {};
      const specificCompletedLevels: any = {};
      let completedLevels = 0;
      let completedStages = 0;

      // Gets all user's progress accross different lesson
      const subjectTemp = ["Html", "Css", "JavaScript", "Database"];

      // Stores the progress sequentially in the object Html -> Css -> JavaSript -> Database
      for (const subjectLoop of subjectTemp) {
        allProgress[subjectLoop] = {};
        allStages[subjectLoop] = {};
        specificCompletedLevels[subjectLoop] = 0;
        const lessonRef = await db.collection(subjectLoop).get();
        for (const lessonTemp of lessonRef.docs) {
          const lessonId = lessonTemp.id;

          const levelsDoc = await db
            .collection("Users")
            .doc(uid)
            .collection("Progress")
            .doc(subjectLoop)
            .collection("Lessons")
            .doc(lessonId)
            .collection("Levels")
            .get();
          for (const levelsTemp of levelsDoc.docs) {
            const levelId = levelsTemp.id;
            const isActive: boolean = levelsTemp.data().isActive;
            const isRewardClaimed: boolean = levelsTemp.data().isRewardClaimed;
            const dateUnlocked: Date = levelsTemp.data().dateUnlocked;
            const isCompleted: boolean = levelsTemp.data().isCompleted;
            const completedAt: Date = levelsTemp.data().completedAt;

            allProgress[subjectLoop][`${lessonId}-${levelId}`] = {
              isActive: isActive,
              isRewardClaimed: isRewardClaimed,
              dateUnlocked: dateUnlocked,
              isCompleted: isCompleted,
              completedAt: completedAt,
            };

            if (isActive === true) {
              specificCompletedLevels[subjectLoop] += 1;
              completedLevels += 1;
            } // Stores all the completed level progress

            const stagesDoc = await db
              .collection("Users")
              .doc(uid)
              .collection("Progress")
              .doc(subjectLoop)
              .collection("Lessons")
              .doc(lessonId)
              .collection("Levels")
              .doc(levelId)
              .collection("Stages")
              .get();

            stagesDoc.forEach((stagesTemp) => {
              const isStageActive: boolean = stagesTemp.data().isActive;
              const isStageCompleted: boolean = stagesTemp.data().isCompleted;
              const dateUnlockStage: Date = stagesTemp.data().dateUnlocked;

              const stageCompletedAt: Date = stagesTemp.data().completedAt;

              allStages[subjectLoop][
                `${lessonId}-${levelId}-${stagesTemp.id}`
              ] = {
                isActive: isStageActive,
                isCompleted: isStageCompleted,
                dateUnlocked: dateUnlockStage,

                completedAt: stageCompletedAt,
              };
              if (isStageActive === true) completedStages += 1; // Stores all the completed stages progress
            });
          }
        }
      }

      return res.status(200).json({
        allProgress,
        allStages,
        completedLevels,
        completedStages,
        specificCompletedLevels,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Something went wrong when fetching user progress" + error,
      });
    }
  }
);

// para sa useGameMode Data q sa web
fireBaseRoute.get(
  "/getGameMode/:subject/:lessonId/:levelId/:stageId",
  middleWare,
  async (req: Request, res: Response) => {
    try {
      const { subject, lessonId, levelId, stageId } = req.params;

      const levelRef = db
        .collection(subject)
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId);
      const levelSnap = await levelRef.get();

      const stageRef = levelRef.collection("Stages").doc(stageId);
      const stageSnap = await stageRef.get();

      if (!levelSnap.exists || !stageSnap.exists) {
        return res.status(404).json({ message: "Level or Stage not found" });
      }

      return res.status(200).json({
        level: { id: levelSnap.id, ...levelSnap.data() },
        stage: { id: stageSnap.id, ...stageSnap.data() },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Error fetching specific game mode",
      });
    }
  }
);

fireBaseRoute.get("/achievements/:category", middleWare, fetchAchievements);
fireBaseRoute.get("/levelCount", middleWare, activeLevels);

export default fireBaseRoute;

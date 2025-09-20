import express, {Request, Response} from "express";
import {middleWare} from "../Middleware/middleWare";

import {db} from "../admin/admin";
import * as admin from "firebase-admin";
import {fetchLesson} from "../Controllers/user/fetchLesson";
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
      const {category, lessonId, levelId} = req.params;
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
        .json({message: "Failed to fetch the stages " + error});
    }
  }
);

// Purchasing an item.
// Not final, might switch to transaction to prevent race conditions
fireBaseRoute.post(
  "/purchaseItem",
  middleWare,
  async (req: IUserRequest, res: Response) => {
    const uid = req.user?.uid; // userid
    const {itemid, itemCost} = req.body;
    // Can pass the user's currency in the body instead, but might stick to this.
    try {
      const userRef = db.collection("Users").doc(uid); // queries user data
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        return res.status(404).json({message: "User does not exist"});
      }

      const userData = userSnap.data();

      if (userData?.coins < itemCost) {
        return res.status(401).json({message: "Not enough coins"});
      }
      // Update's user coins on firebase
      await userRef.update({
        coins: admin.firestore.FieldValue.increment(-Number(itemCost)),
      });

      const inventoryRef = db
        .collection("Users")
        .doc(uid)
        .collection("Inventory")
        .doc(itemid);

      const inventorySnap = await inventoryRef.get();

      if (inventorySnap.exists) {
        await inventoryRef.update({
          quantity: admin.firestore.FieldValue.increment(1),
        });
      } else {
        await inventoryRef.set({quantity: 1});
      }

      return res.status(200).json({
        message: "sucess on purchasing item",
        newCoins: userData?.coins - itemCost,
      }); // returns the new coins for displaying
    } catch (error) {
      return res
        .status(500)
        .json({message: "Failed when purchasing an item"});
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
      const {uid} = req.params;

      const userRef = db.collection("Users").doc(uid);

      const userData = await userRef.get();

      if (!userData.exists) {
        return res.status(400).json({message: "This user does not exist"});
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

// gets all progress of user
// This is deprecated, will delete later.
type progressType = Record<string, boolean>;
fireBaseRoute.get(
  "/userProgres/:subject",
  middleWare,
  async (req: IUserRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      const {subject} = req.params;
      const allProgress: progressType = {};
      const allStages: progressType = {};

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
          const status = levelsTemp.data().status; // gets the status for each levels per specific user
          allProgress[`${lessonId}-${levelId}`] = status;

          if (status === true) completedLevels += 1;

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
            const stageStatus = stagesTemp.data().status;
            allStages[`${lessonId}-${levelId}-${stagesTemp.id}`] = stageStatus; 
            if (stageStatus === true) completedStages += 1;
          });
        }
      }
      return res.status(200).json({
        allProgress,
        allStages,
        completedLevels,
        completedStages,
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
      const {subject} = req.params;

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
      return res.status(404).json({message: "No shop items found"});
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
      .json({message: "Something went wrong when fetchng shop"});
  }
});

// Unlock next stage
fireBaseRoute.post(
  "/unlockStage",
  middleWare,
  async (req: IUserRequest, res: Response) => {
    try {
      const uid = req.user?.uid;

      const {subject, lessonId, levelId, currentStageId} = req.body;

      // queries the currentStageData
      const stageData = db
        .collection(subject)
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId)
        .collection("Stages")
        .doc(currentStageId);

      // Retrieves the order field
      const currentStageDataOrder = (await stageData.get()).data()?.order;

      const nextStageQuery = await db
        .collection(subject)
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId)
        .collection("Stages")
        .where("order", ">", currentStageDataOrder) // gets all the stages where order is greater than currentStageDataOrder
        .orderBy("order") // list by order
        .limit(1) // only gets the next stage (limits to 1)
        .get();

      // if the next stage is empty, unlock the next level instead
      if (nextStageQuery.empty) {
        return res.status(200).json({
          message: "Level Completed",
          setLevelComplete: true,
        });
      }

      const nextStageDoc = nextStageQuery.docs[0];
      const nextStageId = nextStageDoc.id;
      const nextStageType = nextStageDoc.data().type;

      const nextStageRef = db
        .collection("Users")
        .doc(uid)
        .collection("Progress")
        .doc(subject)
        .collection("Lessons")
        .doc(lessonId)
        .collection("Levels")
        .doc(levelId)
        .collection("Stages")
        .doc(nextStageId);

      await nextStageRef.set(
        {
          status: true,
        },
        {merge: true}
      );

      return res.status(200).json({
        message: "Next stage unlocked",
        nextStageId: nextStageId,
        nextStageType: nextStageType,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message:
          "Something went wrong when unlock next stage or lesson" + error,
      });
    }
  }
);

// Return type for level progress
type allProgressType = Record<
  string,
  Record<string, { rewardClaimed: boolean; status: boolean }>
>;
// Return type for stage progress
type allStagesType = Record<string, Record<string, { status: boolean }>>;

fireBaseRoute.get(
  "/userProgress",
  middleWare,
  async (req: IUserRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      console.log(uid);
      const allProgress: allProgressType = {};
      const allStages: allStagesType = {};

      let completedLevels = 0;
      let completedStages = 0;

      // Gets all user's progress accross different lesson
      const subjectTemp = ["Html", "Css", "JavaScript", "Database"];

      // Stores the progress sequentially in the object Html -> Css -> JavaSript -> Database
      for (const subjectLoop of subjectTemp) {
        allProgress[subjectLoop] = {};
        allStages[subjectLoop] = {};
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
            const status: boolean = levelsTemp.data().status; // gets the status for each levels per specific user
            const rewardClaimed: boolean = levelsTemp.data().rewardClaimed; // checks whether reward was claimed (still unused i think)
            allProgress[subjectLoop][`${lessonId}-${levelId}`] = {
              rewardClaimed: rewardClaimed,
              status: status,
            };

            if (status === true) completedLevels += 1; // Stores all the completed level progress

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
              const stageStatus: boolean = stagesTemp.data().status;
              allStages[subjectLoop][
                `${lessonId}-${levelId}-${stagesTemp.id}`
              ] = {
                status: stageStatus, // gets the status for each stages per specific user
              };
              if (stageStatus === true) completedStages += 1; // Stores all the completed stages progress
            });
          }
        }
      }

      return res.status(200).json({
        allProgress,
        allStages,
        completedLevels,
        completedStages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Something went wrong when fetching user progress" + error,
      });
    }
  }
);
export default fireBaseRoute;

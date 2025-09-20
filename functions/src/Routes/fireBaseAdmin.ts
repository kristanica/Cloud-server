import express, {Request, Response} from "express";
import {middleWare} from "../Middleware/middleWare";

import * as admin from "firebase-admin";
import {editStage} from "../Controllers/adminStageEditor/editStage";
import {deleteStage} from "../Controllers/adminStageEditor/deleteStage";
import {getStageData} from "../Controllers/adminStageEditor/getStageData";

import {addLevel} from "../Controllers/adminLessonEditor/addLevel";
import multer from "multer";
import {addLesson} from "../Controllers/adminLessonEditor/addLesson";
import {deleteLesson} from "../Controllers/adminLessonEditor/deleteLesson";
import {getLevelData} from "../Controllers/adminLessonEditor/getLevelData";
import {listStage} from "../Controllers/adminStageEditor/listStage";
import {addStage} from "../Controllers/adminStageEditor/addStage";
import {updateOrder} from "../Controllers/adminStageEditor/updateOrder";
import {uploadVideo} from "../Controllers/adminStageEditor/uploadVideo";
import {getSpecificLevelData} from "../Controllers/adminLevelEditor/getSpecificLevelData";
import {deleteLevel} from "../Controllers/adminLevelEditor/deleteLevel";
import {editLevel} from "../Controllers/adminLevelEditor/editLevel";
import uploadImage from "../Controllers/adminStageEditor/uploadImage";

const fireBaseAdminRoute = express.Router();
const upload = multer({storage: multer.memoryStorage()});
// Still not inused kasi need ata naka deploy na server dito
fireBaseAdminRoute.post(
  "/setAdmin",
  middleWare,

  async (req: Request, res: Response) => {
    try {
      const {uid} = req.body;
      await admin.auth().setCustomUserClaims(uid, {admin: true});

      return res
        .status(200)
        .json({message: "Admin has been set successully"});
    } catch (error) {
      console.log(error);

      return res.status(500).json({message: error});
    }
  }
);

// Gets all levels per specific category
fireBaseAdminRoute.get("/getAllLevel/:category", middleWare, getLevelData);
// Adding a level
fireBaseAdminRoute.post("/addLevel", middleWare, addLevel);

// Adding a lesson
fireBaseAdminRoute.post("/addLesson", middleWare, addLesson);
// Deleting lessons
fireBaseAdminRoute.post("/deleteLesson", middleWare, deleteLesson);

// Stage Editor routes. Might still be unstable. Untested
// Gets all specific data of specific stage
fireBaseAdminRoute.get(
  "/getStage/:category/:lessonId/:levelId/:stageId",
  middleWare,
  getStageData
);
// Editing a stage
fireBaseAdminRoute.post("/editStage", middleWare, editStage);
// Deleting a stage and reordering them automatically
fireBaseAdminRoute.post("/deleteStage", middleWare, deleteStage);

// Listing Stages
fireBaseAdminRoute.get(
  "/listStage/:category/:lessonId/:levelId",
  middleWare,
  listStage
);

// Adding Stages
fireBaseAdminRoute.post("/addStage", middleWare, addStage);

// updating order
fireBaseAdminRoute.post("/updateOrder", middleWare, updateOrder);

// Level Editor
fireBaseAdminRoute.get(
  "/specificLevelData/:category/:lessonId/:levelId",
  middleWare,
  getSpecificLevelData
);

fireBaseAdminRoute.post("/deleteLevel", middleWare, deleteLevel);

fireBaseAdminRoute.post("/editLevel", middleWare, editLevel);

// Seperate call, must be sent as formData and make content-type "multipart/form-data"
fireBaseAdminRoute.post(
  "/uploadImage",
  middleWare,
  upload.single("replicateImage"), // Must be sent as URI. Name of the image on formData MUST be replicateImage
  uploadImage
);

// Seperate call, must be sent as formData and make content-type "multipart/form-data"
fireBaseAdminRoute.post(
  "/uploadVideo",
  middleWare,
  upload.single("video"), // Must be sent as URI. Name of the video on formData MUST be video
  uploadVideo
);

export default fireBaseAdminRoute;

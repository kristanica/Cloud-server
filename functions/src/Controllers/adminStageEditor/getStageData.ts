import {Request, Response} from "express";
import {db} from "../../admin/admin";
export const getStageData = async (req: Request, res: Response) => {
  const {category, lessonId, levelId, stageId} = req.params;
  try {
    const stageSnap = await db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .collection("Stages")
      .doc(stageId)
      .get();
    if (!stageSnap.exists) {
      return res.status(404).json({message: "Stage does not exist"});
    }

    const stageData = stageSnap.data();
    return res.status(200).json(stageData);
  } catch (error) {
    return res.status(500).json({message: error});
  }
};

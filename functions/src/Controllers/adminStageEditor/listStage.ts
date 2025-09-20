import {Request, Response} from "express";
import {db} from "../../admin/admin";
type StageDataProps = {
  id: string;
  title: string;
  description: string;
  type: "lesson" | "game";
  isHidden?: boolean;
};
export const listStage = async (req: Request, res: Response) => {
  const {category, lessonId, levelId} = req.params as {
    category: string;
    lessonId: string;
    levelId: string;
  };
  try {
    const stageRef = db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .collection("Stages");

    const queryByOrder = await stageRef.orderBy("order", "asc").get();

    const stagesData = queryByOrder.docs.map((doc) => {
      return {
        id: doc.id,
        ...(doc.data() as Omit<StageDataProps, "id">),
      };
    });
    return res.status(200).json(stagesData);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({message: "Something went wrong when fetching the stages"});
  }
};

import {Request, Response} from "express";
import {db} from "../../admin/admin";

export const getSpecificLevelData = async (req: Request, res: Response) => {
  const {category, lessonId, levelId} = req.params as {
    category: string;
    lessonId: string;
    levelId: string;
  };

  try {
    const levelRef = await db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .get();
    if (!levelRef.exists) {
      return res.status(404).json({
        message: `Level with ID ${levelId} not found.`,
      });
    }
    const specificLevelData = levelRef.data();

    return res.status(200).json(specificLevelData);
  } catch (error) {
    return res
      .status(500)
      .json({message: `Someting went wrong when getting ${levelId} data.`});
  }
};

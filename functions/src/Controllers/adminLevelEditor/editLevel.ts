import {Request, Response} from "express";
import {db} from "../../admin/admin";

export const editLevel = async (req: Request, res: Response) => {
  const {category, lessonId, levelId, state} = req.body as {
    category: string;
    lessonId: string;
    levelId: string;
    state: any;
  };

  try {
    const levelRef = db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId);

    await levelRef.set(
      {
        ...state,
        expReward: Number(state.expReward),
        coinsReward: Number(state.coinsReward),
      },
      {merge: true}
    );

    return res.status(200).json({
      message: `${levelId} information has been successfully updated!`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({message: `Something went wrong when updating ${levelId}`});
  }
};

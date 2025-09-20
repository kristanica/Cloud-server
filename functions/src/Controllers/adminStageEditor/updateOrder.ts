import {Request, Response} from "express";
import {db} from "../../admin/admin";

export const updateOrder = async (req: Request, res: Response) => {
  const {newOrderData, category, lessonId, levelId} = req.body;

  try {
    const stagesRef = db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .collection("Stages");

    const snapshot = newOrderData.map((item: any) => {
      stagesRef.doc(item.id).set({order: item.order}, {merge: true});
    });
    await Promise.all(snapshot);

    return res.status(200).json({message: "ALl stages has been reordered"});
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({message: "Something went wrong when updating the order"});
  }
};

import {Request, Response} from "express";
import {bucket, db} from "../../admin/admin";
import {getFirestore} from "firebase-admin/firestore";
export const deleteLesson = async (req: Request, res: Response) => {
  try {
    const {category, lessonId} = req.body;
    const lessonRef = await db.collection(category).doc(lessonId);

    await getFirestore().recursiveDelete(lessonRef);

    const filePath = `stageFiles/${category}/${lessonId}`;
    const [files] = await bucket.getFiles({prefix: filePath});
    const deleteFiles = files.map((file) => file.delete());
    await Promise.all(deleteFiles);

    return res
      .status(200)
      .json({message: "Successfully delete lesson " + lessonId});
  } catch (error) {
    return res.status(500).json({message: error});
  }
};

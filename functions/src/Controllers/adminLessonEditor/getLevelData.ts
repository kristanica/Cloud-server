import {Request, Response} from "express";
import {db} from "../../admin/admin";

export const getLevelData = async (req: Request, res: Response) => {
  try {
    const {category} = req.params;

    const subjectRef = (await db.collection(category).get()).docs;

    const lessonData = await Promise.all(
      subjectRef.map(async (lessonDoc) => {
        const levelRef = (
          await db
            .collection(category)
            .doc(lessonDoc.id)
            .collection("Levels")
            .get()
        ).docs;
        const levels = levelRef.map((levelDoc) => ({
          id: levelDoc.id,
          ...levelDoc.data(),
        }));
        return {
          id: lessonDoc.id,
          levelsData: levels,
          ...lessonDoc.data(),
        };
      })
    );
    return res.status(200).json(lessonData);
  } catch (error) {
    return res.status(500).json({message: error});
  }
};

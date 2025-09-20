import {Request, Response} from "express";
import {db} from "../../admin/admin";
export const addLevel = async (req: Request, res: Response) => {
  const {
    category,
    lessonId,
  }: {
    category: string;
    lessonId: string;
  } = req.body;
  try {
    const lessonsData = (
      await db.collection(category).doc(lessonId).collection("Levels").get()
    ).docs;

    const newLevelNumber = lessonsData.map((item) => {
      const match = item.id.match(/Level(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });

    // gets the next number
    const nextNumber =
      (newLevelNumber!.length > 0 ? Math.max(...newLevelNumber!) : 0) + 1;

    const newLevelid = `Level${nextNumber}`;

    await db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(newLevelid)
      .set({
        Level: nextNumber,
        createdAt: new Date(),
      });

    return res.status(200).json({
      message: `Sucessfully added Level ${nextNumber} under ${lessonId}!`,
    });
  } catch (error) {
    return res.status(500).json({message: error});
  }
};

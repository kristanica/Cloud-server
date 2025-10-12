import { db } from "../../admin/admin";
import { Request, Response } from "express";
export const addLesson = async (req: Request, res: Response) => {
  const { category }: { category: string } = req.body;
  try {
    const lessonData = (await db.collection(category).get()).docs;
    const newLessonNumber = lessonData.map((item) => {
      const match = item.id.match(/Lesson(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });

    // gets the next number
    const nextNumber =
      (newLessonNumber!.length > 0 ? Math.max(...newLessonNumber!) : 0) + 1;

    const newLessonId = `Lesson${nextNumber}`;

    await db.collection(category).doc(newLessonId).set({
      Lesson: nextNumber,
      createdAt: new Date(),
    });

    await db
      .collection(category)
      .doc(newLessonId)
      .collection("Levels")
      .doc("Level1")
      .set({
        lesson: 1,
        description: "This is a newly added level, feel free to edit this!",
        title: "This is a template!",
        expReward: 1,
        coinsReward: 1,
        levelOrder: 1,
        createdAt: new Date(),
      });

    return res
      .status(200)
      .json({ message: `Lesson ${nextNumber} has been added sucessfully!` });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

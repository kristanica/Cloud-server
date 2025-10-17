import { Request, Response } from "express";
import { db } from "../../admin/admin";
type ActiveLevelsPayload = Record<
  string,
  {
    levelCounter: number;
  }
>;

export const activeLevels = async (req: Request, res: Response) => {
  try {
    const active: ActiveLevelsPayload = {};

    const subjTemp = ["Html", "Css", "JavaScript", "Database"];

    for (const subjLoop of subjTemp) {
      let count = 0;

      const subjectRef = await db.collection(subjLoop).get();
      const levelPromise = subjectRef.docs.map(async (subjSnapShot) => {
        const levelRef = db
          .collection(subjLoop)
          .doc(subjSnapShot.id)
          .collection("Levels");

        const levelSnap = await levelRef.get();
        count += levelSnap.size;
      });
      await Promise.all(levelPromise);
      active[subjLoop] = { levelCounter: count };
    }
    return res.status(200).json({ active });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

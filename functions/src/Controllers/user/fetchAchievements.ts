import { Request, Response } from "express";
import { db } from "../../admin/admin";

type achievementsReturnType = {
  description: string;
  title: string;
  expReward: number;
  coinsReward: number;
};

export const fetchAchievements = async (req: Request, res: Response) => {
  const { category } = req.params;
  try {
    const achievementsRef = db.collection("Achievements").doc(category);
    const achievementsSnapShot = await achievementsRef.get();

    if (!achievementsSnapShot.exists) {
      return res
        .status(400)
        .json({ message: `Achievement for ${category} does not exist` });
    }

    const achievementData: achievementsReturnType =
      achievementsSnapShot.data() as achievementsReturnType;

    return res.status(200).json(achievementData);
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ message: "Something went wrong when fetching achievements" });
  }
};

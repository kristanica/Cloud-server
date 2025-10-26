import { Response, Request } from "express";
import { db } from "../../admin/admin";
export const deleteAchievement = async (req: Request, res: Response) => {
  try {
    const { category, uid }: { category: string; uid: string } = req.body;
    let startsWith: string;
    switch (category) {
      case "Html": {
        startsWith = "Html";
        break;
      }
      case "Css": {
        startsWith = "Css";
        break;
      }
      case "Database": {
        startsWith = "Db";
        break;
      }
      case "JavaScript": {
        startsWith = "Js";
        break;
      }
      default: {
        return res.status(500).json({ message: "Subject not included" });
      }
    }
    const userRef = db.collection("Users").doc(uid).collection("Achievements");

    const userData = await userRef.get();
    const batch = db.batch();
    userData.docs.forEach((achievementDoc) => {
      const perAchievement = achievementDoc.id;
      if (perAchievement.startsWith(startsWith)) {
        batch.delete(achievementDoc.ref);
      }
    });

    await batch.commit();
    return res
      .status(200)
      .json({ message: "succesfully deleted achievement for user" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed deleting user achievement" });
  }
};

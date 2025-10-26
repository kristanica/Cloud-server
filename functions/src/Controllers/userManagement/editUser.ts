import { Request, Response } from "express";
import { db } from "../../admin/admin";

export const editUser = async (req: Request, res: Response) => {
  try {
    const { username, bio, userLevel, coins, exp, uid } = req.body;

    const userRef = db.collection("Users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: "User not found1" });
    }

    await userRef.update({
      username: username,
      bio: bio,
      userLevel: Number(userLevel),
      coins: Number(coins),
      exp: Number(exp),
    });
    return res.status(200).json({ message: "User updated succesfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error updating user!" });
  }
};

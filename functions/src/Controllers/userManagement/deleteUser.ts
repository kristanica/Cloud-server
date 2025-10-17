import { Request, Response } from "express";
import { auth, db } from "../../admin/admin";

export const deleteUser = async (req: Request, res: Response) => {
  const { uid }: { uid: string } = req.body;

  try {
    const promise: any[] = [];

    const userRef = db.collection("Users").doc(uid);
    promise.push(auth.deleteUser(uid));
    promise.push(userRef.delete());

    await Promise.all(promise);

    return res.status(200).json({ message: "deleted user succesfully" });
  } catch (error) {
    return res.status(500).json(error);
  }
};

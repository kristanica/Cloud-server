import { Request, Response } from "express";
import { db } from "../../admin/admin";

export const suspendUser = async (req: Request, res: Response) => {
  const { id, isSuspended }: { id: string; isSuspended: boolean } = req.body;

  try {
    const userRef = db.collection("Users").doc(id);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.log("User does not exist");
      res.status(404).json({ message: "User does not exist" });
    }

    await userRef.set(
      {
        isSuspended: !isSuspended,
      },
      {
        merge: true,
      }
    );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong when suspending the user" });
  }
};

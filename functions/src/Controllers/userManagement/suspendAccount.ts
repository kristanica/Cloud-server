import { Request, Response } from "express";
import { auth } from "../../admin/admin";

export const suspendAccount = async (req: Request, res: Response) => {
  const { uid, toggleDisable }: { uid: string; toggleDisable: boolean } =
    req.body;

  try {
    await auth.updateUser(uid, {
      disabled: !toggleDisable,
    });
    return res.status(200).json({ uid, isAccountSuspended: !toggleDisable });
  } catch (error) {
    return res.status(500).json(error);
  }
};

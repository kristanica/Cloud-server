import { Request, Response } from "express";
import { db } from "../../admin/admin";

export const searchUser = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    console.log(name);
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Search name is required" });
    }
    const userRef = db.collection("Users");

    const query = userRef
      .where("username", ">=", name)
      .where("username", "<", name + "\uf8ff");

    const querySnapShot = await query.get();

    if (querySnapShot.empty) {
      return res.status(400).json({ message: "No Search result" });
    }

    const searchedUsers = querySnapShot.docs.map((searchUserSnap) => {
      return {
        id: searchUserSnap.id,
        ...searchUserSnap.data(),
      };
    });
    return res.status(200).json(searchedUsers);
  } catch (error) {
    return res.status(500).json(error);
  }
};

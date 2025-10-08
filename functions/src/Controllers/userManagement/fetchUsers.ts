import { Response, Request } from "express";
import { db } from "../../admin/admin";

type userDataProps = {
  username: string;
  email: string;
  userLevel: number;
  isSuspended: boolean;
  isAdmin: boolean;
  profileImage: string;
};

export const fetchUsers = async (req: Request, res: Response) => {
  try {
    const userRef = db.collection("Users");
    const userSnapShot = await userRef.get();

    const userData: userDataProps[] = userSnapShot.docs.map((snap) => {
      return {
        id: snap.id,
        ...(snap.data() as userDataProps),
      };
    });

    res.status(200).json(userData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong when fetching users" });
  }
};

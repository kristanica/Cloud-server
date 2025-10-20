import { Response, Request } from "express";
import { auth, db } from "../../admin/admin";

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

    const userDataTemp: any[] = [];
    const subjectTemp = ["Html", "Css", "JavaScript", "Database"];

    for (const snap of userSnapShot.docs) {
      const userId = snap.id;
      const isAccountSuspended = (await auth.getUser(userId)).disabled;
      const userInfo = snap.data() as userDataProps;

      const levelCount: Record<string, number> = {};

      for (const subjectLoop of subjectTemp) {
        const lessonRef = await userRef
          .doc(userId)
          .collection("Progress")
          .doc(subjectLoop)
          .collection("Lessons")
          .get();

        let userSubjectLevelCount = 0;
        for (const lessonTemp of lessonRef.docs) {
          const lessonId = lessonTemp.id;

          const levelRef = await userRef
            .doc(userId)
            .collection("Progress")
            .doc(subjectLoop)
            .collection("Lessons")
            .doc(lessonId)
            .collection("Levels")
            .get();
          userSubjectLevelCount += levelRef.size;
        }

        levelCount[subjectLoop] = userSubjectLevelCount;
      }
      userDataTemp.push({
        id: userId,
        ...userInfo,
        isAccountSuspended: isAccountSuspended,
        levelCount,
      });
    }

    console.log(userDataTemp);
    res.status(200).json(userDataTemp);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong when fetching users" });
  }
};

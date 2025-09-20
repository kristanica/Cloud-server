import {bucket, db} from "../../admin/admin";
import {Request, Response} from "express";
import {filter} from "../nativeExclusive/filter";
export const editStage = async (req: Request, res: Response) => {
  const {category, lessonId, levelId, stageId, state, stageType} =
    req.body as {
      category: string;
      lessonId: string;
      levelId: string;
      stageId: string;
      state: any;
      stageType?: string;
    };

  const xSource = req.headers["x-source"] as string | undefined;
  try {
    const stageRef = db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .collection("Stages")
      .doc(stageId);

    if (xSource === "mobile-app") {
      const {filteredState, toBeDeleted} = filter(state, stageType);

      await stageRef.set(
        {
          ...filteredState,
          ...toBeDeleted,
          type: state?.type ? state.type : stageType,
        },
        {
          merge: true,
        }
      );
      const filePath = `stageFiles/${category}/${lessonId}/${levelId}/${stageId}/`;

      if (
        filteredState.type !== "Lesson" ||
        filteredState.type !== "CodeCrafter"
      ) {
        const [files] = await bucket.getFiles({prefix: filePath});
        console.log(filePath);
        if (files.length > 0) {
          const deleteFiles = files.map((file) => file.delete());
          await Promise.all(deleteFiles);
        } else {
          console.log("File does notexists");
        }
      }

      return res.status(200).json({
        message: `Stage under ${category}, ${lessonId}, ${levelId} and ${stageId} has been sucessfully been edited! Native!`,
      });
    }
    // web
    await stageRef.set(
      {
        ...state,
        type: state?.type ? state.type : stageType,
      },
      {
        merge: true,
      }
    );
    return res.status(200).json({
      message: `Stage under ${category}, ${lessonId}, ${levelId} and ${stageId} has been sucessfully been edited! Web!`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({message: "Failed to edit stage", error});
  }
};

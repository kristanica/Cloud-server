import { bucket, db } from "../../admin/admin";
import { Request, Response } from "express";
import { filter } from "../nativeExclusive/filter";

export const editStage = async (req: Request, res: Response) => {
  const { category, lessonId, levelId, stageId, stageType } = req.body as {
    category: string;
    lessonId: string;
    levelId: string;
    stageId: string;
    stageType?: string;
  };

  let state =
    typeof req.body.state === "string"
      ? JSON.parse(req.body.state)
      : req.body.state;

  const uploadedFiles = req.files as Express.Multer.File[];

  try {
    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadPromise = uploadedFiles.map(async (file) => {
        const fileName = `${Date.now()}_${file.originalname}`;
        const filePath = `stageFiles/${category}/${lessonId}/${levelId}/${stageId}/${fileName}`;
        const fileRef = bucket.file(filePath);

        await fileRef.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
          public: true,
          resumable: true,
        });
        await fileRef.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        return {
          fieldName: file.fieldname,
          url: publicUrl,
        };
      });

      const uploadedUrls = await Promise.all(uploadPromise);

      if (state.blocks) {
        state.blocks = state.blocks.map((block: any) => {
          if (block.type === "Image" && block.value) {
            const matchingUpload = uploadedUrls.find(
              (upload) => upload.fieldName === block.value
            );

            if (matchingUpload) {
              return { ...block, value: matchingUpload.url };
            }

            return block;
          }
          return block;
        });
      }
    }

    const stageRef = db
      .collection(category)
      .doc(lessonId)
      .collection("Levels")
      .doc(levelId)
      .collection("Stages")
      .doc(stageId);

    const { filteredState, toBeDeleted } = filter(state, stageType);

    // ✅ Single database write
    await stageRef.set(
      {
        ...filteredState,
        ...toBeDeleted,
        type: state?.type ? state.type : stageType,
      },
      { merge: true }
    );

    const filePath = `stageFiles/${category}/${lessonId}/${levelId}/${stageId}/`;

    // Delete files for non-Lesson/CodeCrafter types
    if (
      filteredState.type !== "Lesson" &&
      filteredState.type !== "CodeCrafter"
    ) {
      try {
        const [files] = await bucket.getFiles({ prefix: filePath });
        console.log(filePath);
        if (files.length > 0) {
          const deleteFiles = files.map((file) => file.delete());
          await Promise.all(deleteFiles);
        } else {
          console.log("File does not exist");
        }
      } catch (fileError) {
        console.error("File deletion error:", fileError);
        // Don't fail if file deletion fails
      }
    }

    // ✅ ADD THIS - Return response for ALL types
    return res.status(200).json({
      message: `Stage under ${category}, ${lessonId}, ${levelId} and ${stageId} has been successfully edited!`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to edit stage", error });
  }
};

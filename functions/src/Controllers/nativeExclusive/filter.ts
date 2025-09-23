// will delete the fields on firebase
import { FieldValue } from "firebase-admin/firestore";

const filters: Record<
  string,
  { omit: string[]; toNumber?: (item: any) => void }
> = {
  Lesson: {
    omit: ["hint", "timer", "choices", "copyCode", "imageReplication"],
  },
  BugBust: {
    omit: [
      "timer",
      "choices",
      "copyCode",
      "videoPresentation",
      "imageReplication",
      "blocks",
    ],
  },
  CodeRush: {
    omit: [
      "hint",
      "choices",
      "copyCode",
      "videoPresentation",
      "imageReplication",
      "blocks",
    ],
    toNumber: (item) => ({ ...item, timer: Number(item.timer) }),
  },
  BrainBytes: {
    omit: [
      "timer",
      "hint",
      "copyCode",
      "videoPresentation",
      "imageReplication",
      "blocks",
    ],
  },

  CodeCrafter: {
    omit: [
      "timer",
      "hint",
      "choices",
      "videoPresentation",
      "imageReplication",
      "blocks",
    ],
  },
};

// This is used to automatiically unecessary fields from firebase pragmatically. Ex. If switch from Bug Bust -> Lesson, will delete ["hint", "timer", "choices", "copyCode"] fields on firebase as these fields are unecessary
export const filter = (state: any, stageType?: string) => {
  let filteredState = state;

  const toBeDeleted: any = {};

  const setFilter = filters[state?.type ? state.type : stageType];
  if (setFilter.omit) {
    filteredState = Object.fromEntries(
      Object.entries(state).filter(([key]) => !setFilter.omit!.includes(key))
    );
    // deletes unecessary fields on firebase
    setFilter.omit.forEach((key) => {
      toBeDeleted[key] = FieldValue.delete();
    });
  }

  if (setFilter.toNumber) {
    filteredState = setFilter.toNumber(filteredState);
  }

  return { filteredState, toBeDeleted };
};

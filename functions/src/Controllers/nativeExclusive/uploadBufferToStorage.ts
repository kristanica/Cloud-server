import { bucket } from "../../admin/admin";

export const uploadBufferToStorage = (
  buffer: Buffer,
  destination: string,
  mimeType: string
) => {
  const fileBucket = bucket.file(destination);

  return new Promise<void>((resolve, reject) => {
    const writeStream = fileBucket.createWriteStream({
      metadata: { contentType: mimeType },
      resumable: false,
    });

    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));

    writeStream.end(buffer);
  });
};

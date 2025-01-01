import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export async function saveRequestBodyToS3(
  bucketName: string,
  key: string,
  body: string
): Promise<void> {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: "application/json",
      })
    );
  } catch (error) {
    console.error("saveRequestBodyToS3 error: ", error);

    return;
  }
}

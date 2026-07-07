import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

function getS3Config() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET ?? "chronikon-attachments";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("S3-Konfiguration unvollständig");
  }

  return { endpoint, region, accessKeyId, secretAccessKey, bucket };
}

let s3Client: S3Client | undefined;

export function getS3Client(): S3Client {
  if (!s3Client) {
    const { endpoint, region, accessKeyId, secretAccessKey } = getS3Config();
    s3Client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export async function uploadFile(
  file: Buffer | Uint8Array,
  filename: string,
  mimeType: string,
): Promise<{ storageKey: string; publicUrl: string }> {
  const { bucket } = getS3Config();
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf("."))
    : "";
  const storageKey = `uploads/${uuidv4()}${ext}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: file,
      ContentType: mimeType,
    }),
  );

  return { storageKey, publicUrl: storageKey };
}

export async function downloadFile(
  storageKey: string,
): Promise<{ body: Buffer; mimeType: string }> {
  const { bucket } = getS3Config();
  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    }),
  );

  if (!response.Body) {
    throw new Error("Datei nicht gefunden");
  }

  const bytes = await response.Body.transformToByteArray();
  return {
    body: Buffer.from(bytes),
    mimeType: response.ContentType ?? "application/octet-stream",
  };
}

export async function deleteFile(storageKey: string): Promise<void> {
  const { bucket } = getS3Config();
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    }),
  );
}

export async function createPresignedUploadUrl(
  filename: string,
  mimeType: string,
  expiresInSeconds = 600,
): Promise<{ storageKey: string; uploadUrl: string }> {
  const { bucket } = getS3Config();
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf("."))
    : "";
  const storageKey = `uploads/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: expiresInSeconds,
  });

  return { storageKey, uploadUrl };
}

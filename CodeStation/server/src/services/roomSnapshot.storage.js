const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const env = require("../config/env");

const s3 = new S3Client({ region: env.AWS_REGION });

const getBucket = () => {
  if (!env.S3_BUCKET_NAME) {
    const error = new Error("Room snapshot storage is not configured. Set S3_BUCKET_NAME on the server.");
    error.code = "S3_NOT_CONFIGURED";
    throw error;
  }
  return env.S3_BUCKET_NAME;
};

const getObjectKey = (roomId) => {
  if (typeof roomId !== "string" || !/^[A-Z0-9]{5}$/.test(roomId)) {
    const error = new Error("Room ID must contain exactly five letters or numbers.");
    error.code = "INVALID_ROOM_ID";
    throw error;
  }
  const prefix = env.S3_ROOM_PREFIX.replace(/^\/+|\/+$/g, "");
  return `${prefix ? `${prefix}/` : ""}${roomId}/snapshot.json`;
};

const bodyToString = async (body) => {
  if (typeof body?.transformToString === "function") return body.transformToString();
  const chunks = [];
  for await (const chunk of body) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
};

const loadRoomSnapshot = async (roomId) => {
  // Keep local development usable before the user creates/configures a bucket.
  if (!env.S3_BUCKET_NAME) return null;
  try {
    const response = await s3.send(new GetObjectCommand({
      Bucket: getBucket(),
      Key: getObjectKey(roomId),
    }));
    return JSON.parse(await bodyToString(response.Body));
  } catch (error) {
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
};

const saveRoomSnapshot = async (snapshot) => {
  const body = JSON.stringify(snapshot);
  await s3.send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: getObjectKey(snapshot.roomId),
    Body: body,
    ContentType: "application/json",
    Metadata: { "schema-version": String(snapshot.schemaVersion || 1) },
  }));
  return { savedAt: snapshot.savedAt, bytes: Buffer.byteLength(body) };
};

const createRoomSnapshotIfAbsent = async (snapshot) => {
  if (!env.S3_BUCKET_NAME) return true;
  try {
    const body = JSON.stringify(snapshot);
    await s3.send(new PutObjectCommand({
      Bucket: getBucket(),
      Key: getObjectKey(snapshot.roomId),
      Body: body,
      ContentType: "application/json",
      Metadata: { "schema-version": String(snapshot.schemaVersion || 1) },
      IfNoneMatch: "*",
    }));
    return true;
  } catch (error) {
    if (error.name === "PreconditionFailed" || error.name === "ConditionalRequestConflict" || [409, 412].includes(error.$metadata?.httpStatusCode)) return false;
    throw error;
  }
};

module.exports = { loadRoomSnapshot, saveRoomSnapshot, createRoomSnapshotIfAbsent };

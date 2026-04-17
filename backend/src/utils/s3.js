const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { env } = require("../config/env");

const s3Client = new S3Client({
  region: env.awsRegion,
  endpoint: env.awsEndpoint || undefined,
  followRegionRedirects: true,
  credentials: {
    accessKeyId: env.awsAccessKey,
    secretAccessKey: env.awsSecretKey,
  },
});

async function uploadBuffer({ key, buffer, contentType }) {
  const command = new PutObjectCommand({
    Bucket: env.awsBucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return key;
}

async function getObjectSignedUrl(key, expiresInSeconds, responseContentDisposition) {
  const command = new GetObjectCommand({
    Bucket: env.awsBucketName,
    Key: key,
    ResponseContentDisposition: responseContentDisposition,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

async function getObjectStream(key, range) {
  const command = new GetObjectCommand({
    Bucket: env.awsBucketName,
    Key: key,
    Range: range,
  });

  const response = await s3Client.send(command);
  return {
    body: response.Body,
    contentType: response.ContentType || "application/pdf",
    contentLength: response.ContentLength,
    contentRange: response.ContentRange,
    acceptRanges: response.AcceptRanges,
  };
}

async function getObjectBuffer(key) {
  const command = new GetObjectCommand({
    Bucket: env.awsBucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  const body = response.Body;

  if (!body) {
    throw new Error("Empty S3 object body");
  }

  if (typeof body.transformToByteArray === "function") {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  const chunks = [];
  // Fallback for Node streams where transformToByteArray is unavailable.
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function deleteObject(key) {
  const command = new DeleteObjectCommand({
    Bucket: env.awsBucketName,
    Key: key,
  });

  await s3Client.send(command);
}

module.exports = {
  uploadBuffer,
  getObjectSignedUrl,
  getObjectStream,
  getObjectBuffer,
  deleteObject,
};

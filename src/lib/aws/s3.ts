import { S3Client } from "@aws-sdk/client-s3";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Readable } from "stream"

export const s3 = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.IAM_AWS_ACCESS_KEY!,
        secretAccessKey: process.env.IAM_AWS_SECRET_ACCESS_KEY!
    }
})

function ensureBucket() {
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("AWS_BUCKET_NAME is not configured")
  }
  return process.env.AWS_BUCKET_NAME
}

async function streamToBuffer(body: GetObjectCommandOutput["Body"]): Promise<Buffer> {
  if (!body) {
    throw new Error("Empty S3 response body")
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = []
    for await (const chunk of body) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }

  if (body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer())
  }

  const readable = body as ReadableStream<Uint8Array>
  if (typeof readable?.getReader === "function") {
    const reader = readable.getReader()
    const chunks: Uint8Array[] = []
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
  }

  throw new Error("Unsupported S3 body type")
}

export async function uploadToS3(key: string, body: Buffer | Uint8Array | string, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: ensureBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export async function putJsonToS3(key: string, data: unknown) {
  await uploadToS3(key, JSON.stringify(data), "application/json")
}

export async function getBufferFromS3(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: ensureBucket(),
      Key: key,
    }),
  )

  return streamToBuffer(response.Body)
}

export async function getJsonFromS3<T>(key: string): Promise<T | null> {
  try {
    const buffer = await getBufferFromS3(key)
    return JSON.parse(buffer.toString("utf-8")) as T
  } catch (error: any) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NoSuchKey") {
      return null
    }
    throw error
  }
}

export async function deleteFromS3(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: ensureBucket(),
      Key: key,
    }),
  )
}

export async function objectExistsInS3(key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: ensureBucket(),
        Key: key,
      }),
    )
    return true
  } catch (error: any) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
      return false
    }
    throw error
  }
}

export interface S3Object {
  key: string
  lastModified: Date | undefined
  size: number | undefined
}

export async function listObjectsInS3(prefix: string): Promise<S3Object[]> {
  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: ensureBucket(),
      Prefix: prefix,
    }),
  )

  return (response.Contents || []).map((obj) => ({
    key: obj.Key || "",
    lastModified: obj.LastModified,
    size: obj.Size,
  }))
}

export async function getSignedUrlForObject(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: ensureBucket(),
    Key: key,
  })
  
  return getSignedUrl(s3, command, { expiresIn })
}

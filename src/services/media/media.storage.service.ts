import {
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { spacesClient } from "../../config/spaces"

function getBucket() {
  const bucket = process.env.DO_SPACES_BUCKET
  if (!bucket) throw new Error("DO_SPACES_BUCKET is missing")
  return bucket
}

export function extractStorageKeyFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.pathname.replace(/^\/+/, "")
  } catch {
    return null
  }
}

export async function 

objectExistsInSpaces(storageKey: string) {
  const bucket = getBucket()

  try {
    await spacesClient.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    )
    return true
  } catch {
    return false
  }
}

export async function headObjectInSpaces(storageKey: string) {
  const bucket = getBucket()

  return spacesClient.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    })
  )
}

export async function deleteFromSpaces(storageKey: string) {
  const bucket = getBucket()

  await spacesClient.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    })
  )
}
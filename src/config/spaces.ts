// src/config/spaces.ts

import { S3Client } from "@aws-sdk/client-s3"

const region = process.env.DO_SPACES_REGION
const endpoint = process.env.DO_SPACES_ENDPOINT
const accessKeyId = process.env.DO_SPACES_KEY
const secretAccessKey = process.env.DO_SPACES_SECRET

if (!region) throw new Error("DO_SPACES_REGION is missing")
if (!endpoint) throw new Error("DO_SPACES_ENDPOINT is missing")
if (!accessKeyId) throw new Error("DO_SPACES_KEY is missing")
if (!secretAccessKey) throw new Error("DO_SPACES_SECRET is missing")

export const spacesClient = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})
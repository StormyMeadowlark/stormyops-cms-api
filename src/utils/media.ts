// src/utils/media.ts

import {
  IMAGE_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  AUDIO_MIME_TYPES,
  VIDEO_MIME_TYPES,
} from "../constants/media"

const imageMimeTypes: readonly string[] = IMAGE_MIME_TYPES
const documentMimeTypes: readonly string[] = DOCUMENT_MIME_TYPES
const audioMimeTypes: readonly string[] = AUDIO_MIME_TYPES
const videoMimeTypes: readonly string[] = VIDEO_MIME_TYPES

export function getMediaKindFromMimeType(
  mimeType: string
): "image" | "document" | "audio" | "video" {
  if (imageMimeTypes.includes(mimeType)) return "image"
  if (documentMimeTypes.includes(mimeType)) return "document"
  if (audioMimeTypes.includes(mimeType)) return "audio"
  if (videoMimeTypes.includes(mimeType)) return "video"

  throw Object.assign(new Error("Unsupported mimeType"), { status: 400 })
}

export function sanitizeFileName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
}
import { z } from "zod"
import {
  IMAGE_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  AUDIO_MIME_TYPES,
  VIDEO_MIME_TYPES,
  ALL_MEDIA_MIME_TYPES,
} from "../constants/media"

const mediaKindEnum = z.enum(["image", "document", "audio", "video"])
const allMimeEnum = z.enum(ALL_MEDIA_MIME_TYPES)

const MIME_TYPES_BY_KIND: Record<z.infer<typeof mediaKindEnum>, readonly string[]> = {
  image: IMAGE_MIME_TYPES,
  document: DOCUMENT_MIME_TYPES,
  audio: AUDIO_MIME_TYPES,
  video: VIDEO_MIME_TYPES,
}

export const createMediaSchema = z.object({
  kind: mediaKindEnum,
  fileName: z.string().min(1).max(255),
  originalFileName: z.string().min(1).max(255).optional(),
  displayName: z.string().min(1).max(255).optional(),
  mimeType: allMimeEnum,
  extension: z.string().min(1).max(20).optional(),
  size: z.number().int().nonnegative().optional(),
  storageProvider: z.enum(["local", "s3", "r2", "do-spaces"]).optional(),
  storageKey: z.string().min(1).max(1000),
  url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().nonnegative().optional(),
  defaultAlt: z.string().max(160).optional(),
  defaultCaption: z.string().max(300).optional(),
}).superRefine((data, ctx) => {
  const allowedMimeTypes = MIME_TYPES_BY_KIND[data.kind]
  const isValidForKind = allowedMimeTypes.includes(data.mimeType)

  if (!isValidForKind) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mimeType"],
      message: "mimeType does not match kind",
    })
  }

  if (data.kind === "image") {
    if (data.width !== undefined && data.height === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height"],
        message: "height is required when width is provided for images",
      })
    }

    if (data.height !== undefined && data.width === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: "width is required when height is provided for images",
      })
    }
  }
})

export const updateMediaSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  defaultAlt: z.string().max(160).nullable().optional(),
  defaultCaption: z.string().max(300).nullable().optional(),
})

export const listMediaQuerySchema = z.object({
  kind: z.enum(["image", "document", "audio", "video"]).optional(),
  status: z.enum(["pending", "ready", "failed", "deleted"]).optional(),
  q: z.string().max(255).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})
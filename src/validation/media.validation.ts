// src/validation/media.validation.ts

import { z } from "zod"
import {
  IMAGE_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  AUDIO_MIME_TYPES,
  VIDEO_MIME_TYPES,
  ALL_MEDIA_MIME_TYPES,
} from "../constants/media"
import { MEDIA_IMAGE_DIMENSION_RULES } from "../config/validation-thresholds"

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
  tags: z.array(z.string().min(1).max(50)).max(25).optional(),
  description: z.string().max(500).optional(),
  thumbnailUrl: z.string().url().optional(),
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
    if (data.kind === "image") {
    if (data.width === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: "width is required for images",
      })
    }

    if (data.height === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height"],
        message: "height is required for images",
      })
    }

    if (
      data.width !== undefined &&
      (data.width < MEDIA_IMAGE_DIMENSION_RULES.minWidth ||
        data.width > MEDIA_IMAGE_DIMENSION_RULES.maxWidth)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: `image width must be between ${MEDIA_IMAGE_DIMENSION_RULES.minWidth} and ${MEDIA_IMAGE_DIMENSION_RULES.maxWidth}px`,
      })
    }

    if (
      data.height !== undefined &&
      (data.height < MEDIA_IMAGE_DIMENSION_RULES.minHeight ||
        data.height > MEDIA_IMAGE_DIMENSION_RULES.maxHeight)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height"],
        message: `image height must be between ${MEDIA_IMAGE_DIMENSION_RULES.minHeight} and ${MEDIA_IMAGE_DIMENSION_RULES.maxHeight}px`,
      })
    }
  }
  
  if ((data.kind === "audio" || data.kind === "document") && data.width !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["width"],
      message: "width is only allowed for image or video media",
    })
  }

  if ((data.kind === "audio" || data.kind === "document") && data.height !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["height"],
      message: "height is only allowed for image or video media",
    })
  }
})

export const updateMediaSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(25).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  defaultAlt: z.string().max(160).nullable().optional(),
  defaultCaption: z.string().max(300).nullable().optional(),
})

export const listMediaQuerySchema = z.object({
  kind: z.enum(["image", "document", "audio", "video"]).optional(),
  status: z.enum(["pending", "ready", "failed", "deleted"]).optional(),
  q: z.string().max(255).optional(),
  tag: z.string().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})
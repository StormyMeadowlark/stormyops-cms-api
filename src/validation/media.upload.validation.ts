// src/validation/media.upload.validation.ts

import { z } from "zod"
import { ALL_MEDIA_MIME_TYPES } from "../constants/media"

export const createMediaUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ALL_MEDIA_MIME_TYPES),
  size: z.number().int().positive().max(1024 * 1024 * 250),
})
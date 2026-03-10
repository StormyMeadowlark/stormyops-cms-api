import { nullable, z } from "zod"
import {
  IMAGE_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  AUDIO_MIME_TYPES,
  VIDEO_MIME_TYPES,
} from "../constants/media"

const imageMimeEnum = z.enum(IMAGE_MIME_TYPES)
const documentMimeEnum = z.enum(DOCUMENT_MIME_TYPES)
const audioMimeEnum = z.enum(AUDIO_MIME_TYPES)
const videoMimeEnum = z.enum(VIDEO_MIME_TYPES)
/**
 * Content Blocks
 * - Keep data strict per type so rendering is predictable.
 * - Add new blocks later without DB migrations.
 */

const paragraphBlock = z.object({
  type: z.literal("paragraph"),
  data: z.object({
    text: z.string().min(1).max(20000),
  }),
})

const headingBlock = z.object({
  type: z.literal("heading"),
  data: z.object({
    level: z.enum(["h2", "h3", "h4"]),
    text: z.string().min(1).max(300),
  }),
})

const imageBlock = z.object({
  type: z.literal("image"),
  data: z.object({
    mediaId: z.string().min(1),
    url: z.string().url(),
    mimeType: imageMimeEnum,
    alt: z.string().max(160).optional(),
    caption: z.string().max(300).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
})

const galleryImageItemSchema = z.object({
  mediaId: z.string().min(1),
  url: z.string().url(),
  mimeType: imageMimeEnum,
  alt: z.string().max(160).optional(),
  caption: z.string().max(300).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

const galleryBlock = z.object({
  type: z.literal("gallery"),
  data: z.object({
    layout: z.enum(["grid", "carousel", "masonry"]).default("grid"),
    images: z.array(galleryImageItemSchema).min(2).max(50),
  }),
})

const fileBlock = z.object({
  type: z.literal("file"),
  data: z.object({
    mediaId: z.string().min(1),
    url: z.string().url(),
    fileName: z.string().min(1).max(255),
    mimeType: documentMimeEnum,
    size: z.number().int().nonnegative().optional(),
    title: z.string().max(120).optional(),
    caption: z.string().max(300).optional(),
  }),
})

const audioBlock = z.object({
  type: z.literal("audio"),
  data: z.object({
    mediaId: z.string().min(1),
    url: z.string().url(),
    mimeType: audioMimeEnum,
    title: z.string().max(120).optional(),
    caption: z.string().max(300).optional(),
    duration: z.number().nonnegative().optional(),
  }),
})

const videoBlock = z.object({
  type: z.literal("video"),
  data: z.object({
    mediaId: z.string().min(1),
    url: z.string().url(),
    mimeType: videoMimeEnum,
    posterUrl: z.string().url().optional(),
    title: z.string().max(120).optional(),
    caption: z.string().max(300).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    duration: z.number().nonnegative().optional(),
  }),
})

const codeBlock = z.object({
  type: z.literal("code"),
  data: z.object({
    language: z.string().max(40).optional(), // "ts", "bash", "json"
    code: z.string().min(1).max(200000),
  }),
})

const quoteBlock = z.object({
  type: z.literal("quote"),
  data: z.object({
    text: z.string().min(1).max(5000),
    by: z.string().max(120).optional(),
  }),
})

const calloutBlock = z.object({
  type: z.literal("callout"),
  data: z.object({
    tone: z.enum(["info", "success", "warning", "danger"]).default("info"),
    text: z.string().min(1).max(8000),
  }),
})

const dividerBlock = z.object({
  type: z.literal("divider"),
  data: z.object({}).optional(),
})

const listBlock = z.object({
  type: z.literal("list"),
  data: z.object({
    style: z.enum(["ordered", "unordered"]).default("unordered"),
    items: z.array(z.string().min(1).max(500)).min(1).max(200),
  }),
})

const embedBlock = z.object({
  type: z.literal("embed"),
  data: z.object({
    provider: z.enum(["youtube", "vimeo", "spotify", "loom", "codepen", "generic"]).default("generic"),
    url: z.string().url(),
    title: z.string().max(120).optional(),
    caption: z.string().max(300).optional(),
  }),
})

export const contentBlockSchema = z.discriminatedUnion("type", [
  paragraphBlock,
  headingBlock,
  imageBlock,
  galleryBlock,
  fileBlock,
  audioBlock,
  videoBlock,
  codeBlock,
  quoteBlock,
  calloutBlock,
  dividerBlock,
  listBlock,
  embedBlock,
])

export const seoSchema = z
  .object({
    metaTitle: z.string().max(120).optional(),
    metaDescription: z.string().max(300).optional(),
    ogTitle: z.string().max(120).optional(),
    ogDescription: z.string().max(300).optional(),
    ogImageUrl: z.string().url().optional(),
    canonicalUrl: z.string().url().optional(),
    noindex: z.boolean().optional(),
  })
  .optional()

const basePostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120),
  excerpt: z.string().max(500).optional(),
  content: z.array(contentBlockSchema).optional(),
  tags: z.array(z.string().max(50)).optional(),
  coverImageUrl: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
  featuredRank: z.number().int().min(0).max(9999).optional(),
  featuredExpiresAt: z.string().datetime().optional(),
  seo: seoSchema,
  status: z.enum(["draft", "published"]).optional(),
  scheduledFor: z.string().datetime().optional(),
})

export const createPostSchema = basePostSchema

export const updatePostSchema = basePostSchema.partial()

export const adminPatchSchema = updatePostSchema.omit({
  status: true,
  scheduledFor: true,
})
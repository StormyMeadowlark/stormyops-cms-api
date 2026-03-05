import { nullable, z } from "zod"

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
    url: z.string().url(),
    alt: z.string().max(160).optional(),
    caption: z.string().max(300).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
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
    provider: z.enum(["youtube", "vimeo", "generic"]).default("generic"),
    url: z.string().url(),
    title: z.string().max(120).optional(),
  }),
})

export const contentBlockSchema = z.discriminatedUnion("type", [
  paragraphBlock,
  headingBlock,
  imageBlock,
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

export const createPostSchema = z.object({
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
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  scheduledFor: z.string().datetime().optional(),
})

export const updatePostSchema = createPostSchema.partial()

export const adminPatchSchema = updatePostSchema.omit({
  status: true,
  scheduledFor: true,
})
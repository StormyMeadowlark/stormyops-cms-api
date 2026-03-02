import { z } from "zod"

export const contentBlockSchema = z.object({
  type: z.string().min(1),
  data: z.unknown(),
})

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
  scheduledFor: z.string().datetime().optional(), // ISO string from UI
})

export const updatePostSchema = createPostSchema.partial()
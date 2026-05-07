// src/validation/comment.validation.ts

import { z } from "zod"

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId")

export const commentStatusEnum = z.enum([
  "pending",
  "approved",
  "hidden",
  "flagged",
  "deleted",
  "spam",
])

export const commentFlagReasonEnum = z.enum([
  "language",
  "spam",
  "abuse",
  "promo",
  "link",
  "manual",
])

/**
 * Public comment creation.
 *
 * authorName and authorEmail are intentionally optional here.
 * Whether they are required depends on tenant settings:
 * settings.comments.allowAnonymousComments
 *
 * That rule belongs in the comment service, not the base Zod schema.
 */
export const createPublicCommentSchema = z
  .object({
    postId: objectIdSchema,

    parentCommentId: objectIdSchema.nullable().optional(),

    authorName: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional()
      .or(z.literal("")),

    authorEmail: z
      .string()
      .trim()
      .email()
      .max(254)
      .optional()
      .or(z.literal("")),

    body: z.string().trim().min(1).max(5000),

    notifyOnReplyToComment: z.boolean().optional(),
    notifyOnThreadActivity: z.boolean().optional(),
    sourceUrl: z.string().url().max(500).optional().or(z.literal("")),

    website: z
    .string()
    .url()
    .max(500)
    .optional()
    .or(z.literal("")),

    honeypot: z.string().max(0).optional(),

  })
  .superRefine((data, ctx) => {
    const wantsNotifications =
      data.notifyOnReplyToComment === true ||
      data.notifyOnThreadActivity === true

    const hasEmail =
      typeof data.authorEmail === "string" &&
      data.authorEmail.trim().length > 0

    if (wantsNotifications && !hasEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["authorEmail"],
        message: "Email is required for comment notifications.",
      })
    }
  })

/**
 * Public commenter edit.
 *
 * Ownership will be verified through commenter cookie/session hash
 * in the service/controller layer.
 */
export const updatePublicCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),

  notifyOnReplyToComment: z.boolean().optional(),
  notifyOnThreadActivity: z.boolean().optional(),

  authorEmail: z
    .string()
    .trim()
    .email()
    .max(254)
    .optional()
    .or(z.literal("")),
}).superRefine((data, ctx) => {
  const wantsNotifications =
    data.notifyOnReplyToComment === true ||
    data.notifyOnThreadActivity === true

  const hasEmail =
    typeof data.authorEmail === "string" &&
    data.authorEmail.trim().length > 0

  if (wantsNotifications && !hasEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["authorEmail"],
      message: "Email is required for comment notifications.",
    })
  }
})

/**
 * Admin reply.
 *
 * Admin replies are still comments, but they will be created
 * by an authenticated admin/editor and linked to parentCommentId.
 */
export const createAdminCommentReplySchema = z.object({
  body: z.string().trim().min(1).max(5000),
})

/**
 * Admin list/filter query.
 */
export const listAdminCommentsQuerySchema = z.object({
  postId: objectIdSchema.optional(),
  parentCommentId: objectIdSchema.optional(),

  status: commentStatusEnum.optional(),
  flagReason: commentFlagReasonEnum.optional(),

  q: z.string().trim().max(255).optional(),

  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

/**
 * Public comment list query for a post.
 */
export const listPublicCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

/**
 * Manual admin flagging.
 */
export const flagCommentSchema = z.object({
  flagReason: commentFlagReasonEnum.default("manual"),
})

/**
 * Admin status updates.
 * Most moderation actions will use route-specific endpoints:
 * approve, hide, restore, spam, delete.
 *
 * This schema is useful if you also add a generic PATCH route later.
 */
export const updateAdminCommentSchema = z.object({
  status: commentStatusEnum.optional(),
  flagReason: commentFlagReasonEnum.nullable().optional(),
  body: z.string().trim().min(1).max(5000).optional(),
})
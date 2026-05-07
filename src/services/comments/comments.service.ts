// src/services/comments/comments.service.ts

import crypto from "crypto"
import { Types } from "mongoose"
import {
  Comment,
  type CommentFlagReason,
  type CommentStatus,
} from "../../models/Comment"
import { Post } from "../../models/Post"
import { getOrCreateSettings } from "../settings/settings.service"
import { areCommentsAllowedForPostType } from "../settings/settings-policy.service"

type PostType = "blog" | "video" | "audio" | "resource" | "page"

type CreatePublicCommentData = {
  postId: string
  parentCommentId?: string | null
  authorName?: string
  authorEmail?: string
  body: string
  notifyOnReplyToComment?: boolean
  notifyOnThreadActivity?: boolean
  sourceUrl?: string
  website?: string
  honeypot?: string
}

type UpdateAdminCommentData = {
  status?: CommentStatus
  flagReason?: CommentFlagReason
  body?: string
}

function toObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) return null
  return new Types.ObjectId(id)
}

function createServiceError(message: string, status = 400, details?: Record<string, any>) {
  return Object.assign(new Error(message), {
    status,
    ...(details ? { details } : {}),
  })
}

function cleanString(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function normalizeEmail(email?: string | null) {
  const cleaned = cleanString(email)
  return cleaned ? cleaned.toLowerCase() : null
}

function getEmailSecret() {
  const secret = process.env.COMMENT_EMAIL_ENCRYPTION_KEY

  if (!secret) {
    throw createServiceError(
      "COMMENT_EMAIL_ENCRYPTION_KEY is missing",
      500
    )
  }

  return secret
}

function getEmailEncryptionKey() {
  return crypto
    .createHash("sha256")
    .update(getEmailSecret())
    .digest()
}

function encryptEmail(email: string) {
  const key = getEmailEncryptionKey()
  const iv = crypto.randomBytes(12)

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([
    cipher.update(email, "utf8"),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return [
    "v1",
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":")
}

function hashEmail(email: string) {
  return crypto
    .createHmac("sha256", getEmailSecret())
    .update(email)
    .digest("hex")
}

export function hashCommenterToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")
}

function prepareEmailFields(authorEmail?: string | null) {
  const normalizedEmail = normalizeEmail(authorEmail)

  if (!normalizedEmail) {
    return {
      authorEmailEncrypted: null,
      authorEmailHash: null,
      authorEmailProvided: false,
    }
  }

  return {
    authorEmailEncrypted: encryptEmail(normalizedEmail),
    authorEmailHash: hashEmail(normalizedEmail),
    authorEmailProvided: true,
  }
}

function countLinks(text: string) {
  const matches = text.match(/https?:\/\/|www\./gi)
  return matches?.length ?? 0
}

function hasRepeatedCharacters(text: string) {
  return /(.)\1{8,}/i.test(text)
}

function containsAny(text: string, phrases: string[]) {
  const lower = text.toLowerCase()
  return phrases.some((phrase) => lower.includes(phrase))
}

function getModerationStrictness(settings: any): "low" | "medium" | "high" {
  return settings?.comments?.moderationStrictness ?? "high"
}

function getLinkLimit(settings: any) {
  const strictness = getModerationStrictness(settings)

  if (strictness === "low") return 5
  if (strictness === "medium") return 3
  return 2
}

function moderateComment(params: {
  settings: any
  body: string
  honeypotTriggered: boolean
}) {
  const { settings, body, honeypotTriggered } = params

  const autoFlagSpam = settings?.comments?.autoFlagSpam ?? true
  const autoFlagLanguage = settings?.comments?.autoFlagLanguage ?? true
  const strictness = getModerationStrictness(settings)
  const linkCount = countLinks(body)

  const promoPhrases = [
    "buy now",
    "free money",
    "casino",
    "crypto",
    "loan offer",
    "seo services",
    "limited time offer",
    "click here",
  ]

  const languagePhrases = [
    "fuck",
    "shit",
    "bitch",
    "asshole",
  ]

  const abusePhrases = [
    "kill yourself",
    "i will hurt you",
    "you should die",
    "i know where you live",
  ]

  if (honeypotTriggered) {
    return {
      shouldFlag: true,
      status: "spam" as CommentStatus,
      flagReason: "spam" as CommentFlagReason,
      reason: "Honeypot field was filled.",
    }
  }

  if (autoFlagSpam) {
    if (linkCount > getLinkLimit(settings)) {
      return {
        shouldFlag: true,
        status: strictness === "high" ? "flagged" : "pending",
        flagReason: "link" as CommentFlagReason,
        reason: "Too many links.",
      }
    }

    if (containsAny(body, promoPhrases)) {
      return {
        shouldFlag: true,
        status: strictness === "low" ? "pending" : "flagged",
        flagReason: "promo" as CommentFlagReason,
        reason: "Promotional language detected.",
      }
    }

    if (hasRepeatedCharacters(body)) {
      return {
        shouldFlag: true,
        status: "flagged" as CommentStatus,
        flagReason: "spam" as CommentFlagReason,
        reason: "Repeated characters detected.",
      }
    }
  }

  if (autoFlagLanguage) {
    if (containsAny(body, abusePhrases)) {
      return {
        shouldFlag: true,
        status: "flagged" as CommentStatus,
        flagReason: "abuse" as CommentFlagReason,
        reason: "Abusive or threatening language detected.",
      }
    }

    if (containsAny(body, languagePhrases)) {
      return {
        shouldFlag: true,
        status: strictness === "high" ? "flagged" : "pending",
        flagReason: "language" as CommentFlagReason,
        reason: "Flagged language detected.",
      }
    }
  }

  return {
    shouldFlag: false,
    status: null,
    flagReason: null,
    reason: null,
  }
}

function getInitialCommentStatus(params: {
  settings: any
  moderation: ReturnType<typeof moderateComment>
}) {
  const { settings, moderation } = params

  const requireApproval = settings?.comments?.requireApproval ?? true
  const autoHideUntilReviewed = settings?.comments?.autoHideUntilReviewed ?? false

  if (moderation.status === "spam") {
    return {
      status: "spam" as CommentStatus,
      flagReason: moderation.flagReason,
      approvedAt: null,
    }
  }

  if (moderation.shouldFlag) {
    return {
      status: autoHideUntilReviewed ? "hidden" as CommentStatus : "flagged" as CommentStatus,
      flagReason: moderation.flagReason,
      approvedAt: null,
    }
  }

  if (requireApproval) {
    return {
      status: "pending" as CommentStatus,
      flagReason: null,
      approvedAt: null,
    }
  }

  return {
    status: "approved" as CommentStatus,
    flagReason: null,
    approvedAt: new Date(),
  }
}

async function getPublishedPostForComment(params: {
  tenantId: string
  postId: string
}) {
  const postOid = toObjectId(params.postId)
  if (!postOid) throw createServiceError("Invalid postId", 400)

  const post = await Post.findOne({
    _id: postOid,
    tenantId: params.tenantId,
    status: "published",
    publishedAt: { $ne: null, $lte: new Date() },
  })
    .select("_id title slug postType commentsEnabled status")
    .lean()

  if (!post) {
    throw createServiceError("Post not found", 404)
  }

  return post
}

async function validateParentComment(params: {
  tenantId: string
  postId: string
  parentCommentId?: string | null
}) {
  if (!params.parentCommentId) return null

  const postOid = toObjectId(params.postId)
  if (!postOid) throw createServiceError("Invalid postId", 400)

  const parentOid = toObjectId(params.parentCommentId)
  if (!parentOid) throw createServiceError("Invalid parentCommentId", 400)

  const parent = await Comment.findOne({
    _id: parentOid,
    tenantId: params.tenantId,
    postId: postOid,
    status: "approved",
  }).lean()

  if (!parent) {
    throw createServiceError("Parent comment not found or not available for replies", 404)
  }

  return parent
}

function requireCommenterSessionHash(commenterSessionHash?: string | null) {
  const hash = cleanString(commenterSessionHash)

  if (!hash) {
    throw createServiceError("Commenter session is required", 401)
  }

  return hash
}

export async function createPublicComment(params: {
  tenantId: string
  commenterSessionHash: string
  data: CreatePublicCommentData
}) {
  const settings = await getOrCreateSettings(params.tenantId)

  const post = await getPublishedPostForComment({
    tenantId: params.tenantId,
    postId: params.data.postId,
  })

  const postType = (post.postType ?? "blog") as PostType

  const postOid = toObjectId(params.data.postId)
    if (!postOid) throw createServiceError("Invalid postId", 400)

    const parentCommentOid = params.data.parentCommentId
    ? toObjectId(params.data.parentCommentId)
    : null

    if (params.data.parentCommentId && !parentCommentOid) {
    throw createServiceError("Invalid parentCommentId", 400)
    }

  if (!areCommentsAllowedForPostType(settings, postType)) {
    throw createServiceError("Comments are disabled for this post type", 409)
  }

  if (!post.commentsEnabled) {
    throw createServiceError("Comments are disabled for this post", 409)
  }

  await validateParentComment({
    tenantId: params.tenantId,
    postId: params.data.postId,
    parentCommentId: params.data.parentCommentId,
  })

  const authorName = cleanString(params.data.authorName)
  const authorEmail = normalizeEmail(params.data.authorEmail)
  const allowAnonymousComments =
    settings?.comments?.allowAnonymousComments ?? false

  if (!allowAnonymousComments && (!authorName || !authorEmail)) {
    throw createServiceError(
      "Name and email are required to comment.",
      400,
      {
        fields: ["authorName", "authorEmail"],
      }
    )
  }

  const emailFields = prepareEmailFields(authorEmail)
  const honeypotTriggered = Boolean(params.data.honeypot)

  const moderation = moderateComment({
    settings,
    body: params.data.body,
    honeypotTriggered,
  })

  const initialStatus = getInitialCommentStatus({
    settings,
    moderation,
  })

  const commenterSessionHash = requireCommenterSessionHash(
    params.commenterSessionHash
  )

  const doc = await Comment.create({
    tenantId: params.tenantId,
    postId: postOid,
    parentCommentId: parentCommentOid,

    authorName,
    ...emailFields,
    isAnonymous: !authorEmail,

    body: params.data.body,

    status: initialStatus.status,
    flagReason: initialStatus.flagReason,
    approvedAt: initialStatus.approvedAt,
    approvedBy: null,

    commenterSessionHash,

    notifyOnReplyToComment:
      Boolean(params.data.notifyOnReplyToComment) && Boolean(authorEmail),
    notifyOnThreadActivity:
      Boolean(params.data.notifyOnThreadActivity) && Boolean(authorEmail),

    sourceUrl: cleanString(params.data.sourceUrl),
    website: cleanString(params.data.website),
    honeypotTriggered,

    lastRepliedAt: null,
  })

  if (params.data.parentCommentId) {
    await Comment.updateOne(
      {
        _id: toObjectId(params.data.parentCommentId),
        tenantId: params.tenantId,
      },
      {
        $inc: { replyCount: 1 },
        $set: { lastRepliedAt: new Date() },
      }
    )
  }

  return doc
}

export async function listPublicApprovedComments(params: {
  tenantId: string
  postId: string
  page?: number
  limit?: number
}) {
  const postOid = toObjectId(params.postId)
  if (!postOid) throw createServiceError("Invalid postId", 400)

  const limit = Math.min(Math.max(Number(params.limit || 50), 1), 100)
  const page = Math.max(Number(params.page || 1), 1)
  const skip = (page - 1) * limit

  const filter = {
    tenantId: params.tenantId,
    postId: postOid,
    status: "approved",
  }

  const [items, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .select(
        "postId parentCommentId authorName isAnonymous body status replyCount isEdited editedAt lastRepliedAt createdAt updatedAt"
      )
      .lean(),
    Comment.countDocuments(filter),
  ])

  return {
    items,
    total,
    page,
    limit,
  }
}

export async function listAdminComments(params: {
  tenantId: string
  postId?: string
  parentCommentId?: string
  status?: CommentStatus
  flagReason?: Exclude<CommentFlagReason, null>
  q?: string
  page?: number
  limit?: number
}) {
  const limit = Math.min(Math.max(Number(params.limit || 25), 1), 100)
  const page = Math.max(Number(params.page || 1), 1)
  const skip = (page - 1) * limit

  const filter: any = {
    tenantId: params.tenantId,
  }

  if (params.postId) {
    const oid = toObjectId(params.postId)
    if (!oid) throw createServiceError("Invalid postId", 400)
    filter.postId = oid
  }

  if (params.parentCommentId) {
    const oid = toObjectId(params.parentCommentId)
    if (!oid) throw createServiceError("Invalid parentCommentId", 400)
    filter.parentCommentId = oid
  }

  if (params.status) filter.status = params.status
  if (params.flagReason) filter.flagReason = params.flagReason

  if (params.q) {
    const re = new RegExp(params.q, "i")
    filter.$or = [
      { authorName: re },
      { body: re },
      { sourceUrl: re },
      { website: re },
    ]
  }

  const [items, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postId", "title slug postType status")
      .populate("approvedBy", "email role")
      .populate("deletedBy", "email role")
      .lean(),
    Comment.countDocuments(filter),
  ])

  return {
    items,
    total,
    page,
    limit,
  }
}

export async function getCommentById(params: {
  tenantId: string
  id: string
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw createServiceError("Invalid id", 400)

  const doc = await Comment.findOne({
    _id: oid,
    tenantId: params.tenantId,
  })
    .populate("postId", "title slug postType status")
    .populate("parentCommentId", "authorName body status createdAt")
    .populate("approvedBy", "email role")
    .populate("deletedBy", "email role")
    .lean()

  if (!doc) {
    throw createServiceError("Comment not found", 404)
  }

  return doc
}

export async function approveComment(params: {
  tenantId: string
  userId: string
  id: string
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw createServiceError("Invalid id", 400)

  const doc = await Comment.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      status: { $ne: "deleted" },
    },
    {
      $set: {
        status: "approved",
        flagReason: null,
        approvedAt: new Date(),
        approvedBy: params.userId,
      },
    },
    { new: true }
  ).lean()

  if (!doc) throw createServiceError("Comment not found", 404)

  return doc
}

export async function rejectComment(params: {
  tenantId: string
  userId: string
  id: string
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw createServiceError("Invalid id", 400)

  const doc = await Comment.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      status: { $ne: "deleted" },
    },
    {
      $set: {
        status: "hidden",
        flagReason: "manual",
        approvedAt: null,
        approvedBy: null,
      },
    },
    { new: true }
  ).lean()

  if (!doc) throw createServiceError("Comment not found", 404)

  return doc
}

export async function hideComment(params: {
  tenantId: string
  userId: string
  id: string
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw createServiceError("Invalid id", 400)

  const doc = await Comment.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      status: { $ne: "deleted" },
    },
    {
      $set: {
        status: "hidden",
        flagReason: "manual",
        approvedAt: null,
        approvedBy: null,
      },
    },
    { new: true }
  ).lean()

  if (!doc) throw createServiceError("Comment not found", 404)

  return doc
}

export async function restoreComment(params: {
  tenantId: string
  userId: string
  id: string
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw createServiceError("Invalid id", 400)

  const settings = await getOrCreateSettings(params.tenantId)
  const requireApproval = settings?.comments?.requireApproval ?? true

  const nextStatus: CommentStatus = requireApproval ? "pending" : "approved"

  const doc = await Comment.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
    },
    {
      $set: {
        status: nextStatus,
        flagReason: null,
        deletedAt: null,
        deletedBy: null,
        approvedAt: nextStatus === "approved" ? new Date() : null,
        approvedBy: nextStatus === "approved" ? params.userId : null,
      },
    },
    { new: true }
  ).lean()

  if (!doc) throw createServiceError("Comment not found", 404)

  return doc
}

export async function deleteComment(params: {
  tenantId: string
  userId: string
  id: string
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw createServiceError("Invalid id", 400)

  const doc = await Comment.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      status: { $ne: "deleted" },
    },
    {
      $set: {
        status: "deleted",
        deletedAt: new Date(),
        deletedBy: params.userId,
      },
    },
    { new: true }
  ).lean()

  if (!doc) throw createServiceError("Comment not found", 404)

  return {
    ok: true,
    deleted: true,
  }
}

export async function replyToComment(params: {
  tenantId: string
  userId: string
  userEmail: string
  id: string
  body: string
}) {
  const parentOid = toObjectId(params.id)
  if (!parentOid) throw createServiceError("Invalid id", 400)

  const parent = await Comment.findOne({
    _id: parentOid,
    tenantId: params.tenantId,
    status: { $ne: "deleted" },
  }).lean()

  if (!parent) {
    throw createServiceError("Parent comment not found", 404)
  }

  const now = new Date()

  const reply = await Comment.create({
    tenantId: params.tenantId,
    postId: parent.postId,
    parentCommentId: parent._id,

    authorName: params.userEmail,
    authorEmailEncrypted: null,
    authorEmailHash: null,
    authorEmailProvided: false,
    isAnonymous: false,

    body: params.body,

    status: "approved",
    flagReason: null,
    approvedAt: now,
    approvedBy: params.userId,

    commenterSessionHash: hashCommenterToken(`admin:${params.userId}`),

    notifyOnReplyToComment: false,
    notifyOnThreadActivity: false,

    lastRepliedAt: null,
  })

  await Comment.updateOne(
    {
      _id: parent._id,
      tenantId: params.tenantId,
    },
    {
      $inc: { replyCount: 1 },
      $set: { lastRepliedAt: now },
    }
  )

  return reply
}

export async function updateAdminComment(params: {
  tenantId: string
  userId: string
  id: string
  data: UpdateAdminCommentData
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw createServiceError("Invalid id", 400)

  const update: any = {}

  if (params.data.status !== undefined) update.status = params.data.status
  if (params.data.flagReason !== undefined) {
    update.flagReason = params.data.flagReason
  }

  if (params.data.body !== undefined) {
    const existing = await Comment.findOne({
      _id: oid,
      tenantId: params.tenantId,
    }).select("+editHistory")

    if (!existing) {
      throw createServiceError("Comment not found", 404)
    }

    update.body = params.data.body
    update.isEdited = true
    update.editedAt = new Date()
    update.lastEditedBy = "admin"
    update.$inc = { editCount: 1 }
    update.$push = {
      editHistory: {
        body: existing.body,
        editedAt: new Date(),
        editedBy: "admin",
      },
    }
  }

  const mongoUpdate =
    update.$inc || update.$push
      ? {
          $set: Object.fromEntries(
            Object.entries(update).filter(
              ([key]) => !key.startsWith("$")
            )
          ),
          ...(update.$inc ? { $inc: update.$inc } : {}),
          ...(update.$push ? { $push: update.$push } : {}),
        }
      : { $set: update }

  const doc = await Comment.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      status: { $ne: "deleted" },
    },
    mongoUpdate,
    { new: true }
  ).lean()

  if (!doc) throw createServiceError("Comment not found", 404)

  return doc
}
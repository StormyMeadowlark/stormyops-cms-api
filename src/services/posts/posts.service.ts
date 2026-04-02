import { Types } from "mongoose"
import { Media } from "../../models/Media"
import { Post } from "../../models/Post"
import { normalizeSlug, isValidSlug } from "../../utils/slug"
import { getOrCreateSettings } from "../settings/settings.service"
import { mapSettingsToReadiness } from "../settings/settings-to-readiness"
import { evaluatePostReadiness } from "./post.readiness.service"


function isDuplicateKeyError(err: any) {
  return err && (err.code === 11000 || err.codeName === "DuplicateKey")
}

function toObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) return null
  return new Types.ObjectId(id)
}

function collectMediaRefsFromContent(content: any[] = []) {
  const refs: Array<{
    mediaId: string
    expectedKind: "image" | "document" | "audio" | "video"
    blockType: string
    blockIndex: number
    nestedIndex?: number
    url?: string
  }> = []

  for (let i = 0; i < content.length; i++) {
    const block = content[i]
    if (!block || typeof block !== "object") continue

    switch (block.type) {
      case "image":
        if (block.data?.mediaId) {
          refs.push({
            mediaId: block.data.mediaId,
            expectedKind: "image",
            blockType: "image",
            blockIndex: i,
            url: block.data.url,
          })
        }
        break

      case "gallery": {
        const images = Array.isArray(block.data?.images) ? block.data.images : []
        for (let j = 0; j < images.length; j++) {
          const image = images[j]
          if (!image?.mediaId) continue

          refs.push({
            mediaId: image.mediaId,
            expectedKind: "image",
            blockType: "gallery",
            blockIndex: i,
            nestedIndex: j,
            url: image.url,
          })
        }
        break
      }

      case "file":
        if (block.data?.mediaId) {
          refs.push({
            mediaId: block.data.mediaId,
            expectedKind: "document",
            blockType: "file",
            blockIndex: i,
            url: block.data.url,
          })
        }
        break

      case "audio":
        if (block.data?.mediaId) {
          refs.push({
            mediaId: block.data.mediaId,
            expectedKind: "audio",
            blockType: "audio",
            blockIndex: i,
            url: block.data.url,
          })
        }
        break

      case "video":
        if (block.data?.mediaId) {
          refs.push({
            mediaId: block.data.mediaId,
            expectedKind: "video",
            blockType: "video",
            blockIndex: i,
            url: block.data.url,
          })
        }
        break
    }
  }

  return refs
}

function normalizeSeo(seo: any) {
  if (!seo) return {}

  const normalized: any = {
    ...seo,
  }

  if (typeof normalized.metaTitle === "string") {
    normalized.metaTitle = normalized.metaTitle.trim()
    if (!normalized.metaTitle) normalized.metaTitle = null
  }

  if (typeof normalized.metaDescription === "string") {
    normalized.metaDescription = normalized.metaDescription.trim()
    if (!normalized.metaDescription) normalized.metaDescription = null
  }

  if (typeof normalized.ogTitle === "string") {
    normalized.ogTitle = normalized.ogTitle.trim()
    if (!normalized.ogTitle) normalized.ogTitle = null
  }

  if (typeof normalized.ogDescription === "string") {
    normalized.ogDescription = normalized.ogDescription.trim()
    if (!normalized.ogDescription) normalized.ogDescription = null
  }

  if (typeof normalized.canonicalUrl === "string") {
    normalized.canonicalUrl = normalized.canonicalUrl.trim()
    if (!normalized.canonicalUrl) normalized.canonicalUrl = null
  }

  if (normalized.ogImage) {
    normalized.ogImage = {
      url:
        typeof normalized.ogImage.url === "string" && normalized.ogImage.url.trim()
          ? normalized.ogImage.url.trim()
          : null,
      mediaId:
        typeof normalized.ogImage.mediaId === "string" && normalized.ogImage.mediaId.trim()
          ? normalized.ogImage.mediaId.trim()
          : null,
    }
  }

  return normalized
}

async function validatePostMediaReferences(params: {
  tenantId: string
  content?: any[]
}) {
  const refs = collectMediaRefsFromContent(params.content || [])
  if (refs.length === 0) return

  const uniqueIds = [...new Set(refs.map((r) => r.mediaId))]
  const objectIds = uniqueIds
    .map((id) => toObjectId(id))
    .filter((id): id is Types.ObjectId => !!id)

  if (objectIds.length !== uniqueIds.length) {
    throw Object.assign(new Error("One or more content mediaId values are invalid"), {
      status: 400,
    })
  }

  const mediaDocs = await Media.find({
    _id: { $in: objectIds },
    tenantId: params.tenantId,
  })
    .select("_id kind status url")
    .lean()

  const mediaMap = new Map(mediaDocs.map((doc) => [doc._id.toString(), doc]))

  for (const ref of refs) {
    const media = mediaMap.get(ref.mediaId)

    const location =
      ref.nestedIndex !== undefined
        ? `${ref.blockType} block at index ${ref.blockIndex}, item ${ref.nestedIndex}`
        : `${ref.blockType} block at index ${ref.blockIndex}`

    if (!media) {
      throw Object.assign(
        new Error(`Referenced media does not exist for ${location}`),
        { status: 400 }
      )
    }

    if (media.status !== "ready") {
      throw Object.assign(
        new Error(`Referenced media is not ready for ${location}`),
        { status: 400 }
      )
    }

    if (media.kind !== ref.expectedKind) {
      throw Object.assign(
        new Error(
          `Referenced media kind mismatch for ${location}. Expected ${ref.expectedKind}, got ${media.kind}`
        ),
        { status: 400 }
      )
    }

    if (ref.url && media.url !== ref.url) {
      throw Object.assign(
        new Error(`Referenced media url does not match stored media for ${location}`),
        { status: 400 }
      )
    }
  }
}

async function validateCoverImageReference(params: {
  tenantId: string
  coverImageMediaId?: string | null
  coverImageUrl?: string | null
}) {
  if (!params.coverImageMediaId) return

  const oid = toObjectId(params.coverImageMediaId)
  if (!oid) {
    throw Object.assign(new Error("coverImageMediaId is invalid"), { status: 400 })
  }

  const media = await Media.findOne({
    _id: oid,
    tenantId: params.tenantId,
  })
    .select("_id kind status url")
    .lean()

  if (!media) {
    throw Object.assign(new Error("Featured image media does not exist"), { status: 400 })
  }

  if (media.status !== "ready") {
    throw Object.assign(new Error("Featured image media is not ready"), { status: 400 })
  }

  if (media.kind !== "image") {
    throw Object.assign(new Error("Featured image media must be an image"), { status: 400 })
  }

  if (params.coverImageUrl && media.url !== params.coverImageUrl) {
    throw Object.assign(
      new Error("Featured image url does not match stored media"),
      { status: 400 }
    )
  }
}

async function validateOgImageReference(params: {
  tenantId: string
  ogImageMediaId?: string | null
  ogImageUrl?: string | null
}) {
  if (!params.ogImageMediaId) return

  const oid = toObjectId(params.ogImageMediaId)
  if (!oid) {
    throw Object.assign(new Error("seo.ogImage.mediaId is invalid"), { status: 400 })
  }

  const media = await Media.findOne({
    _id: oid,
    tenantId: params.tenantId,
  })
    .select("_id kind status url")
    .lean()

  if (!media) {
    throw Object.assign(new Error("OG image media does not exist"), { status: 400 })
  }

  if (media.status !== "ready") {
    throw Object.assign(new Error("OG image media is not ready"), { status: 400 })
  }

  if (media.kind !== "image") {
    throw Object.assign(new Error("OG image media must be an image"), { status: 400 })
  }

  if (params.ogImageUrl && media.url !== params.ogImageUrl) {
    throw Object.assign(
      new Error("OG image url does not match stored media"),
      { status: 400 }
    )
  }
}

async function assertPostCanProceed(params: {
  tenantId: string
  post: any
  forAction: "publish" | "schedule"
}) {
  if (!params.post.requireValidationToPublish) return

  const settings = await getOrCreateSettings(params.tenantId)
  const readinessSettings = mapSettingsToReadiness(settings)
  const readiness = await evaluatePostReadiness(params.post, readinessSettings)

  if (!readiness.isPublishable) {
    throw Object.assign(
      new Error(`Post cannot ${params.forAction} because validation failed`),
      {
        status: 409,
        details: readiness,
      }
    )
  }

  if (
    params.forAction === "publish" &&
    !settings.publishing.allowPublishWithWarnings &&
    readiness.warnings.length > 0
  ) {
    throw Object.assign(
      new Error("Post cannot publish because warnings are not allowed by settings"),
      { status: 409, details: readiness }
    )
  }

  if (
    params.forAction === "schedule" &&
    !settings.publishing.allowScheduleWithWarnings &&
    readiness.warnings.length > 0
  ) {
    throw Object.assign(
      new Error("Post cannot schedule because warnings are not allowed by settings"),
      { status: 409, details: readiness }
    )
  }
}

export async function createPost(params: { tenantId: string; userId: string; data: any }) {
  const slug = normalizeSlug(params.data.slug || "")
  if (!slug || !isValidSlug(slug)) {
    throw Object.assign(new Error("Invalid slug"), { status: 400 })
  }

  const status = params.data.status || "draft"
  const now = new Date()
  const publishedAt = status === "published" ? now : null

  const seo = normalizeSeo(params.data.seo)

  await validatePostMediaReferences({
    tenantId: params.tenantId,
    content: params.data.content || [],
  })

  await validateCoverImageReference({
    tenantId: params.tenantId,
    coverImageMediaId: params.data.coverImageMediaId,
    coverImageUrl: params.data.coverImageUrl,
  })

  await validateOgImageReference({
    tenantId: params.tenantId,
    ogImageMediaId: seo.ogImage?.mediaId,
    ogImageUrl: seo.ogImage?.url,
  })

  try {
    const doc = await Post.create({
      tenantId: params.tenantId,
      title: params.data.title,
      slug,
      excerpt: params.data.excerpt,
      content: params.data.content || [],
      tags: params.data.tags || [],
      category:
        typeof params.data.category === "string" && params.data.category.trim()
          ? params.data.category.trim().toLowerCase()
          : "blog",
      commentsEnabled: params.data.commentsEnabled ?? true,
      requireValidationToPublish: params.data.requireValidationToPublish ?? true,
      coverImageUrl: params.data.coverImageUrl?.trim() ? params.data.coverImageUrl.trim() : null,
      coverImageMediaId: params.data.coverImageMediaId?.trim()
        ? params.data.coverImageMediaId.trim()
        : null,
      seo,

      status,
      scheduledFor: null,
      publishedAt,

      isFeatured: params.data.isFeatured ?? false,
      featuredRank: params.data.featuredRank ?? 0,
      featuredExpiresAt: params.data.featuredExpiresAt
        ? new Date(params.data.featuredExpiresAt)
        : null,

      createdBy: params.userId,
      updatedBy: params.userId,
    })

    return doc
  } catch (err: any) {
    if (isDuplicateKeyError(err)) {
      throw Object.assign(new Error("Slug already exists for this tenant"), { status: 409 })
    }
    throw err
  }
}

export async function listAdminPosts(params: {
  tenantId: string
  q?: string
  status?: string
  limit?: number
  page?: number
}) {
  const limit = Math.min(Math.max(Number(params.limit || 20), 1), 100)
  const page = Math.max(Number(params.page || 1), 1)
  const skip = (page - 1) * limit

  const filter: any = { tenantId: params.tenantId }

  if (params.status) filter.status = params.status

  if (params.q) {
    const re = new RegExp(params.q, "i")
    filter.$or = [{ title: re }, { slug: re }, { tags: re }]
  }

  const [items, total] = await Promise.all([
    Post.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-content") // keep list light; editor loads full post
      .lean(),
    Post.countDocuments(filter),
  ])

  return { items, total, page, limit }
}

export async function getAdminPostById(params: { tenantId: string; id: string }) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const doc = await Post.findOne({ _id: oid, tenantId: params.tenantId }).lean()
  if (!doc) throw Object.assign(new Error("Not found"), { status: 404 })
  return doc
}

export async function updatePost(params: { tenantId: string; userId: string; id: string; data: any }) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const update: any = { ...params.data, updatedBy: params.userId }

  delete update.status
  delete update.scheduledFor
  delete update.publishedAt

  if (typeof update.slug === "string") {
    const slug = normalizeSlug(update.slug)
    if (!slug || !isValidSlug(slug)) {
      throw Object.assign(new Error("Invalid slug"), { status: 400 })
    }
    update.slug = slug
  }

  if (typeof update.category === "string") {
    update.category = update.category.trim().toLowerCase()
    if (!update.category) update.category = "blog"
  }

  if (typeof update.coverImageUrl === "string") {
    update.coverImageUrl = update.coverImageUrl.trim()
    if (!update.coverImageUrl) update.coverImageUrl = null
  }

  if (typeof update.coverImageMediaId === "string") {
    update.coverImageMediaId = update.coverImageMediaId.trim()
    if (!update.coverImageMediaId) update.coverImageMediaId = null
  }

  if (update.seo !== undefined) {
    update.seo = normalizeSeo(update.seo)
  }

  if (typeof update.featuredExpiresAt === "string") {
    update.featuredExpiresAt = new Date(update.featuredExpiresAt)
  }
  if (update.featuredExpiresAt === undefined) delete update.featuredExpiresAt

  if (update.content !== undefined) {
    await validatePostMediaReferences({
      tenantId: params.tenantId,
      content: update.content,
    })
  }

  if (update.coverImageMediaId !== undefined || update.coverImageUrl !== undefined) {
    await validateCoverImageReference({
      tenantId: params.tenantId,
      coverImageMediaId: update.coverImageMediaId,
      coverImageUrl: update.coverImageUrl,
    })
  }

  if (update.seo?.ogImage) {
    await validateOgImageReference({
      tenantId: params.tenantId,
      ogImageMediaId: update.seo.ogImage.mediaId,
      ogImageUrl: update.seo.ogImage.url,
    })
  }

  try {
    const doc = await Post.findOneAndUpdate(
      { _id: oid, tenantId: params.tenantId },
      { $set: update },
      { new: true }
    ).lean()

    if (!doc) throw Object.assign(new Error("Not found"), { status: 404 })
    return doc
  } catch (err: any) {
    if (isDuplicateKeyError(err)) {
      throw Object.assign(new Error("Slug already exists for this tenant"), { status: 409 })
    }
    throw err
  }
}

export async function deletePost(params: { tenantId: string; id: string }) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const res = await Post.deleteOne({ _id: oid, tenantId: params.tenantId })
  if (res.deletedCount === 0) throw Object.assign(new Error("Not found"), { status: 404 })
  return { ok: true }
}

// --- Status actions ---
export async function publishPost(params: { tenantId: string; userId: string; id: string }) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const now = new Date()

  const post = await Post.findOne({
    _id: oid,
    tenantId: params.tenantId,
    $or: [
      { status: "draft" },
      { status: "scheduled", scheduledFor: { $ne: null, $lte: now } },
    ],
  }).lean()

  if (!post) {
    throw Object.assign(new Error("Not found or not ready to publish"), { status: 409 })
  }

  await assertPostCanProceed({
    tenantId: params.tenantId,
    post,
    forAction: "publish",
  })

  const doc = await Post.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      $or: [
        { status: "draft" },
        { status: "scheduled", scheduledFor: { $ne: null, $lte: now } },
      ],
    },
    {
      $set: {
        status: "published",
        publishedAt: now,
        scheduledFor: null,
        updatedBy: params.userId,
      },
    },
    { new: true }
  ).lean()

  if (!doc) {
    throw Object.assign(new Error("Not found or not ready to publish"), { status: 409 })
  }

  return doc
}

export async function unpublishPost(params: { tenantId: string; userId: string; id: string }) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const doc = await Post.findOneAndUpdate(
    { _id: oid, tenantId: params.tenantId },
    { $set: { status: "draft", publishedAt: null, scheduledFor: null, updatedBy: params.userId } },
    { new: true }
  ).lean()

  if (!doc) throw Object.assign(new Error("Not found"), { status: 404 })
  return doc
}

export async function schedulePost(params: {
  tenantId: string
  userId: string
  id: string
  scheduledFor: Date
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  if (!(params.scheduledFor instanceof Date) || isNaN(params.scheduledFor.getTime())) {
    throw Object.assign(new Error("Invalid scheduledFor"), { status: 400 })
  }

  if (params.scheduledFor.getTime() <= Date.now()) {
    throw Object.assign(new Error("scheduledFor must be in the future"), { status: 400 })
  }

  const post = await Post.findOne({
    _id: oid,
    tenantId: params.tenantId,
    status: { $in: ["draft", "scheduled"] },
  }).lean()

  if (!post) {
    throw Object.assign(
      new Error("Not found or post cannot be scheduled from its current status"),
      { status: 409 }
    )
  }

  await assertPostCanProceed({
    tenantId: params.tenantId,
    post,
    forAction: "schedule",
  })

  const doc = await Post.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      status: { $in: ["draft", "scheduled"] },
    },
    {
      $set: {
        status: "scheduled",
        scheduledFor: params.scheduledFor,
        publishedAt: null,
        updatedBy: params.userId,
      },
    },
    { new: true }
  ).lean()

  if (!doc) {
    throw Object.assign(
      new Error("Not found or post cannot be scheduled from its current status"),
      { status: 409 }
    )
  }

  return doc
}

export async function archivePost(params: { tenantId: string; userId: string; id: string }) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const doc = await Post.findOneAndUpdate(
    { _id: oid, tenantId: params.tenantId },
    {
      $set: {
        status: "archived",
        scheduledFor: null,
        updatedBy: params.userId,
      },
    },
    { new: true }
  ).lean()

  if (!doc) throw Object.assign(new Error("Not found"), { status: 404 })
  return doc
}

export async function unarchivePost(params: { tenantId: string; userId: string; id: string }) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const doc = await Post.findOneAndUpdate(
    { _id: oid, tenantId: params.tenantId },
    {
      $set: {
        status: "draft",
        scheduledFor: null,
        updatedBy: params.userId,
      },
    },
    { new: true }
  ).lean()

  if (!doc) throw Object.assign(new Error("Not found"), { status: 404 })
  return doc
}

// --- Public reads ---
export async function listPublicPosts(params: {
  tenantId: string
  limit?: number
  page?: number
  tag?: string
}) {
  const limit = Math.min(Math.max(Number(params.limit || 12), 1), 50)
  const page = Math.max(Number(params.page || 1), 1)
  const skip = (page - 1) * limit

  const filter: any = {
    tenantId: params.tenantId,
    status: "published",
    publishedAt: { $ne: null, $lte: new Date() },
  }

  if (params.tag) filter.tags = params.tag

  const [items, total] = await Promise.all([
    Post.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title slug excerpt tags coverImageUrl publishedAt seo isFeatured featuredRank")
      .lean(),
    Post.countDocuments(filter),
  ])

  return { items, total, page, limit }
}

export async function getPublicPostBySlug(params: { tenantId: string; slug: string }) {
  const slug = normalizeSlug(params.slug || "")
  if (!slug || !isValidSlug(slug)) throw Object.assign(new Error("Invalid slug"), { status: 400 })

  const doc = await Post.findOne({
    tenantId: params.tenantId,
    slug,
    status: "published",
    publishedAt: { $ne: null, $lte: new Date() },
  }).lean()

  if (!doc) throw Object.assign(new Error("Not found"), { status: 404 })
  return doc
}

export async function listFeaturedPosts(params: { tenantId: string; limit?: number }) {
  const limit = Math.min(Math.max(Number(params.limit || 6), 1), 12)

  const filter: any = {
    tenantId: params.tenantId,
    status: "published",
    isFeatured: true,
    publishedAt: { $ne: null, $lte: new Date() },
    $or: [{ featuredExpiresAt: null }, { featuredExpiresAt: { $gt: new Date() } }],
  }

  const items = await Post.find(filter)
    .sort({ featuredRank: 1, publishedAt: -1 })
    .limit(limit)
    .select("title slug excerpt tags coverImageUrl publishedAt seo featuredRank")
    .lean()

  return { items }
}
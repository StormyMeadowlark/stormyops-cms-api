import { Types } from "mongoose"
import { Post } from "../../models/Post"
import { normalizeSlug, isValidSlug } from "../../utils/slug"

function isDuplicateKeyError(err: any) {
  return err && (err.code === 11000 || err.codeName === "DuplicateKey")
}

function toObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) return null
  return new Types.ObjectId(id)
}

export async function createPost(params: { tenantId: string; userId: string; data: any }) {
  const slug = normalizeSlug(params.data.slug || "")
  if (!slug || !isValidSlug(slug)) {
    throw Object.assign(new Error("Invalid slug"), { status: 400 })
  }

  const status = params.data.status || "draft"
  const now = new Date()

  const publishedAt = status === "published" ? now : null

  try {
    const doc = await Post.create({
      tenantId: params.tenantId,
      title: params.data.title,
      slug,
      excerpt: params.data.excerpt,
      content: params.data.content || [],
      tags: params.data.tags || [],
      coverImageUrl: params.data.coverImageUrl ?? null,
      seo: params.data.seo || {},

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

  if (typeof update.slug === "string") {
    const slug = normalizeSlug(update.slug)
    if (!slug || !isValidSlug(slug)) throw Object.assign(new Error("Invalid slug"), { status: 400 })
    update.slug = slug
  }

  if (typeof update.scheduledFor === "string") update.scheduledFor = new Date(update.scheduledFor)
  if (update.scheduledFor === undefined) delete update.scheduledFor

  if (typeof update.featuredExpiresAt === "string") update.featuredExpiresAt = new Date(update.featuredExpiresAt)
  if (update.featuredExpiresAt === undefined) delete update.featuredExpiresAt

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

  const doc = await Post.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      // allow publishing from draft OR scheduled that is due
      $or: [
        { status: "draft" },
        { status: "scheduled", scheduledFor: { $ne: null, $lte: now } },
      ],
    },
    { $set: { status: "published", publishedAt: now, scheduledFor: null, updatedBy: params.userId } },
    { new: true }
  ).lean()

  if (!doc) throw Object.assign(new Error("Not found or not ready to publish"), { status: 409 })
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
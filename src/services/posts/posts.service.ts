import { Post } from "../../models/Post"
import { normalizeSlug, isValidSlug } from "../../utils/slug"

export async function createPost(params: {
  tenantId: string
  userId: string
  data: any
}) {
  const slug = normalizeSlug(params.data.slug || "")
  if (!slug || !isValidSlug(slug)) {
    throw Object.assign(new Error("Invalid slug"), { status: 400 })
  }

  const doc = await Post.create({
    tenantId: params.tenantId,
    title: params.data.title,
    slug,
    excerpt: params.data.excerpt,
    content: params.data.content || [],
    tags: params.data.tags || [],
    coverImageUrl: params.data.coverImageUrl,
    seo: params.data.seo || {},
    status: params.data.status || "draft",
    scheduledFor: params.data.scheduledFor ? new Date(params.data.scheduledFor) : null,
    publishedAt: params.data.status === "published" ? new Date() : null,
    createdBy: params.userId,
    updatedBy: params.userId,
  })

  return doc
}
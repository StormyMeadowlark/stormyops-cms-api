// src/services/settings/settings-policy.service.ts

type PostPolicyAction = "create" | "update" | "publish" | "schedule"

export type PostType = "blog" | "video" | "audio" | "resource" | "page"

type PostPolicyData = {
  title?: string
  slug?: string
  postType?: PostType | null
  category?: string | null
  tags?: string[]
  commentsEnabled?: boolean
}

type ValidatePostPolicyParams = {
  settings: any
  data: PostPolicyData
  action: PostPolicyAction
}

function createPolicyError(message: string, details?: Record<string, any>) {
  return Object.assign(new Error(message), {
    status: 409,
    ...(details ? { details } : {}),
  })
}

function normalizeCategory(category?: string | null) {
  return category?.trim().toLowerCase() || "blog"
}

function normalizeCategories(categories?: string[]) {
  return Array.isArray(categories)
    ? categories
        .map((category) => category.trim().toLowerCase())
        .filter(Boolean)
    : []
}

function normalizeTags(tags?: string[]) {
  if (!Array.isArray(tags)) return []

  return tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
}

function dedupeTags(tags: string[]) {
  return [...new Set(tags)]
}

function normalizePostType(postType?: string | null): PostType | null {
  if (!postType) return null

  const normalized = postType.trim().toLowerCase()

  if (
    normalized === "blog" ||
    normalized === "video" ||
    normalized === "audio" ||
    normalized === "resource" ||
    normalized === "page"
  ) {
    return normalized
  }

  return null
}

/**
 * Backward compatibility.
 * Before postType existed, category was being used to infer content type.
 */
export function getPostTypeFromCategory(category?: string | null): PostType {
  const normalizedCategory = normalizeCategory(category)

  if (normalizedCategory === "video" || normalizedCategory === "videos") {
    return "video"
  }

  if (
    normalizedCategory === "audio" ||
    normalizedCategory === "podcast" ||
    normalizedCategory === "podcasts"
  ) {
    return "audio"
  }

  if (
    normalizedCategory === "resource" ||
    normalizedCategory === "resources" ||
    normalizedCategory === "document" ||
    normalizedCategory === "documents"
  ) {
    return "resource"
  }

  if (normalizedCategory === "page" || normalizedCategory === "pages") {
    return "page"
  }

  return "blog"
}

export function getPostType(data: PostPolicyData): PostType {
  const explicitPostType = normalizePostType(data.postType)

  if (explicitPostType) {
    return explicitPostType
  }

  return getPostTypeFromCategory(data.category)
}

export function isPostTypeEnabled(settings: any, postType: PostType) {
  const contentSettings = settings?.content || {}

  switch (postType) {
    case "video":
      return contentSettings.enableVideoPosts ?? true
    case "audio":
      return contentSettings.enableAudioPosts ?? true
    case "resource":
      return contentSettings.enableResources ?? true
    case "page":
      return contentSettings.enablePages ?? true
    case "blog":
    default:
      return contentSettings.enableBlogPosts ?? true
  }
}

export function getEnabledPostTypes(settings: any): PostType[] {
  const postTypes: PostType[] = ["blog", "video", "audio", "resource", "page"]

  return postTypes.filter((postType) => isPostTypeEnabled(settings, postType))
}

export function areCommentsAllowedForPostType(settings: any, postType: PostType) {
  const commentSettings = settings?.comments || {}

  switch (postType) {
    case "video":
      return commentSettings.allowOnVideo ?? true
    case "audio":
      return commentSettings.allowOnAudio ?? true
    case "resource":
      return commentSettings.allowOnResource ?? true
    case "page":
      return commentSettings.allowOnPage ?? false
    case "blog":
    default:
      return commentSettings.allowOnBlog ?? true
  }
}

export function resolvePostDefaultsFromSettings(params: {
  settings: any
  data: PostPolicyData
}) {
  const postType = getPostType(params.data)
  const category = normalizeCategory(params.data.category)
  const tags = dedupeTags(normalizeTags(params.data.tags))

  return {
    postType,
    category,
    tags,
    commentsEnabled:
      params.data.commentsEnabled ??
      areCommentsAllowedForPostType(params.settings, postType),
  }
}

function validateContentTypePolicy(params: {
  settings: any
  data: PostPolicyData
  action: PostPolicyAction
}) {
  const postType = getPostType(params.data)

  if (!isPostTypeEnabled(params.settings, postType)) {
    throw createPolicyError(`Posts of type "${postType}" are disabled in settings.`, {
      action: params.action,
      field: "postType",
      postType,
    })
  }
}

function validateCategoryPolicy(params: {
  settings: any
  data: PostPolicyData
  action: PostPolicyAction
}) {
  const contentSettings = params.settings?.content || {}

  const enableCategories = contentSettings.enableCategories ?? true
  const category = normalizeCategory(params.data.category)
  const allowedCategories = normalizeCategories(contentSettings.categories)

  if (!enableCategories) {
    if (category !== "blog") {
      throw createPolicyError("Categories are disabled in settings.", {
        action: params.action,
        field: "category",
      })
    }

    return
  }

  if (allowedCategories.length > 0) {
    const categoryIsAllowed = allowedCategories.includes(category)

    if (!categoryIsAllowed) {
      throw createPolicyError(`Category "${category}" is not allowed by settings.`, {
        action: params.action,
        field: "category",
        allowedCategories,
      })
    }
  }
}

function validateTagPolicy(params: {
  settings: any
  data: PostPolicyData
  action: PostPolicyAction
}) {
  const contentSettings = params.settings?.content || {}

  const tags = dedupeTags(normalizeTags(params.data.tags))
  const enableTags = contentSettings.enableTags ?? true
  const maxTags = contentSettings.maxTags ?? 5

  if (!enableTags && tags.length > 0) {
    throw createPolicyError("Tags are disabled in settings.", {
      action: params.action,
      field: "tags",
    })
  }

  if (tags.length > maxTags) {
    throw createPolicyError(`Posts can have a maximum of ${maxTags} tags.`, {
      action: params.action,
      field: "tags",
      maxTags,
      received: tags.length,
    })
  }
}

function validateCommentPolicy(params: {
  settings: any
  data: PostPolicyData
  action: PostPolicyAction
}) {
  const postType = getPostType(params.data)
  const commentsAllowed = areCommentsAllowedForPostType(params.settings, postType)

  if (params.data.commentsEnabled === true && !commentsAllowed) {
    throw createPolicyError(`Comments are disabled for ${postType} posts in settings.`, {
      action: params.action,
      field: "commentsEnabled",
      postType,
    })
  }
}

export function validatePostPolicy(params: ValidatePostPolicyParams) {
  validateContentTypePolicy(params)
  validateCategoryPolicy(params)
  validateTagPolicy(params)
  validateCommentPolicy(params)
}
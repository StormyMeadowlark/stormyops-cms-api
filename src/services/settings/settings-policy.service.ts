// src/services/settings/settings-policy.service.ts

type PostPolicyAction = "create" | "update" | "publish" | "schedule"

type PostPolicyData = {
  title?: string
  slug?: string
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

function getPostTypeFromCategory(category: string) {
  if (category === "video" || category === "videos") return "video"
  if (category === "audio" || category === "podcast" || category === "podcasts") return "audio"
  if (
    category === "resource" ||
    category === "resources" ||
    category === "document" ||
    category === "documents"
  ) {
    return "resource"
  }

  return "blog"
}

function isPostTypeEnabled(settings: any, postType: string) {
  const contentSettings = settings?.content || {}

  switch (postType) {
    case "video":
      return contentSettings.enableVideoPosts ?? true
    case "audio":
      return contentSettings.enableAudioPosts ?? true
    case "resource":
      return contentSettings.enableResources ?? true
    case "blog":
    default:
      return contentSettings.enableBlogPosts ?? true
  }
}

function areCommentsAllowedForPostType(settings: any, postType: string) {
  const commentSettings = settings?.comments || {}

  switch (postType) {
    case "video":
      return commentSettings.allowOnVideo ?? true
    case "audio":
      return commentSettings.allowOnAudio ?? true
    case "resource":
      return commentSettings.allowOnResource ?? true
    case "blog":
    default:
      return commentSettings.allowOnBlog ?? true
  }
}

export function resolvePostDefaultsFromSettings(params: {
  settings: any
  data: PostPolicyData
}) {
  const category = normalizeCategory(params.data.category)
  const postType = getPostTypeFromCategory(category)

  return {
    category,
    commentsEnabled:
      params.data.commentsEnabled ?? areCommentsAllowedForPostType(params.settings, postType),
  }
}

export function validatePostPolicy(params: ValidatePostPolicyParams) {
  const { settings, data, action } = params

  const contentSettings = settings?.content || {}
  const category = normalizeCategory(data.category)
  const postType = getPostTypeFromCategory(category)

  const tags = Array.isArray(data.tags)
    ? data.tags.map((tag) => tag.trim()).filter(Boolean)
    : []

  const enableTags = contentSettings.enableTags ?? true
  const maxTags = contentSettings.maxTags ?? 5

  if (!enableTags && tags.length > 0) {
    throw createPolicyError("Tags are disabled in settings.", {
      action,
      field: "tags",
    })
  }

  if (tags.length > maxTags) {
    throw createPolicyError(`Posts can have a maximum of ${maxTags} tags.`, {
      action,
      field: "tags",
      maxTags,
      received: tags.length,
    })
  }

  const enableCategories = contentSettings.enableCategories ?? true
  const allowedCategories = normalizeCategories(contentSettings.categories)

  if (enableCategories && allowedCategories.length > 0) {
    const categoryIsAllowed = allowedCategories.includes(category)

    if (!categoryIsAllowed) {
      throw createPolicyError(`Category "${category}" is not allowed by settings.`, {
        action,
        field: "category",
        allowedCategories,
      })
    }
  }

  if (!isPostTypeEnabled(settings, postType)) {
    throw createPolicyError(`Posts of type "${postType}" are disabled in settings.`, {
      action,
      field: "category",
      postType,
    })
  }

  const commentsAllowed = areCommentsAllowedForPostType(settings, postType)

  if (data.commentsEnabled === true && !commentsAllowed) {
    throw createPolicyError(
      `Comments are disabled for ${postType} posts in settings.`,
      {
        action,
        field: "commentsEnabled",
        postType,
      }
    )
  }
}

export function isPostCategoryEnabled(settings: any, category?: string | null) {
  const normalizedCategory = normalizeCategory(category)
  const postType = getPostTypeFromCategory(normalizedCategory)

  return isPostTypeEnabled(settings, postType)
}
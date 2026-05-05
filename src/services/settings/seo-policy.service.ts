// src/services/settings/seo-policy.service.ts

type SeoPost = {
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  postType?: "blog" | "video" | "audio" | "resource" | "page" | null
  coverImageUrl?: string | null
  publishedAt?: Date | string | null
  updatedAt?: Date | string | null
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
    ogTitle?: string | null
    ogDescription?: string | null
    canonicalUrl?: string | null
    noindex?: boolean | null
    ogImage?: {
      url?: string | null
      mediaId?: string | null
    } | null
  } | null
}

function cleanText(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function trimTo(value: string | null, max: number) {
  if (!value) return null
  return value.length > max ? value.slice(0, max).trim() : value
}

function normalizeBaseUrl(value?: string | null) {
  const cleaned = cleanText(value)
  if (!cleaned) return null
  return cleaned.replace(/\/+$/, "")
}

function getPostPath(post: SeoPost) {
  const slug = cleanText(post.slug)
  if (!slug) return null

  const postType = post.postType ?? "blog"

  switch (postType) {
    case "page":
      return `/${slug}`
    case "video":
      return `/videos/${slug}`
    case "audio":
      return `/podcast/${slug}`
    case "resource":
      return `/resources/${slug}`
    case "blog":
    default:
      return `/blog/${slug}`
  }
}

function applyMetaTitleFormat(params: {
  format?: string | null
  postTitle: string
  siteName: string
}) {
  const format = cleanText(params.format) || "[Post Title] | [Site Name]"

  return format
    .replaceAll("[Post Title]", params.postTitle)
    .replaceAll("[Site Name]", params.siteName)
    .trim()
}

export function resolveSeoFromSettings(params: {
  settings: any
  post: SeoPost
}) {
  const { settings, post } = params

  const siteName = cleanText(settings?.site?.siteName) || "StormyOps"
  const siteDescription = cleanText(settings?.site?.siteDescription)
  const baseUrl = normalizeBaseUrl(settings?.site?.domain)

  const postTitle = cleanText(post.title) || siteName
  const postExcerpt = cleanText(post.excerpt)

  const explicitMetaTitle = cleanText(post.seo?.metaTitle)
  const fallbackMetaTitle = applyMetaTitleFormat({
    format: settings?.seo?.metaTitleFormat,
    postTitle,
    siteName,
  })

  const metaTitle = trimTo(explicitMetaTitle || fallbackMetaTitle, 120)

  const explicitMetaDescription = cleanText(post.seo?.metaDescription)

  const fallbackMetaDescription =
    settings?.seo?.useExcerptAsMetaDescriptionFallback !== false
      ? postExcerpt || siteDescription
      : siteDescription

  const metaDescription = trimTo(
    explicitMetaDescription || fallbackMetaDescription,
    300
  )

  const ogTitle = trimTo(cleanText(post.seo?.ogTitle) || metaTitle, 120)

  const ogDescription = trimTo(
    cleanText(post.seo?.ogDescription) || metaDescription,
    300
  )

  const ogImageUrl =
    cleanText(post.seo?.ogImage?.url) ||
    cleanText(post.coverImageUrl) ||
    cleanText(settings?.site?.defaultOgImage?.url)

  const explicitCanonicalUrl = cleanText(post.seo?.canonicalUrl)
  const postPath = getPostPath(post)

  const canonicalUrl =
    explicitCanonicalUrl || (baseUrl && postPath ? `${baseUrl}${postPath}` : null)

  const noindex = Boolean(post.seo?.noindex) || settings?.seo?.indexSite === false

  return {
    metaTitle,
    metaDescription,
    canonicalUrl,
    noindex,

    ogTitle,
    ogDescription,
    ogImage: ogImageUrl
      ? {
          url: ogImageUrl,
          mediaId:
            post.seo?.ogImage?.mediaId ||
            settings?.site?.defaultOgImage?.mediaId ||
            null,
        }
      : null,

    showPublishedOrEditedDate:
      settings?.seo?.showPublishedOrEditedDate ?? true,

    publishedAt: post.publishedAt ?? null,
    updatedAt: post.updatedAt ?? null,
  }
}
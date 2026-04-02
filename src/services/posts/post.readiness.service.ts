// src/services/posts/post.readiness.service.ts

import { Media } from "../../models/Media"
import { isValidSlug } from "../../utils/slug"

export type ReadinessSeverity = "blocking" | "error" | "warning"

export type ReadinessRuleCode =
  | "post_title_missing"
  | "slug_missing"
  | "slug_invalid"
  | "featured_image_conditionally_missing"
  | "content_missing"
  | "featured_image_wrong_dimensions"
  | "featured_image_missing_alt_text"
  | "seo_title_missing"
  | "meta_description_missing"
  | "content_snippet_missing"
  | "og_title_missing"
  | "og_description_missing"
  | "og_image_missing"
  | "post_title_under"
  | "post_title_over"
  | "seo_title_under"
  | "seo_title_over"
  | "meta_description_under"
  | "meta_description_over"
  | "content_snippet_under"
  | "content_snippet_over"
  | "og_title_under"
  | "og_title_over"
  | "og_description_under"
  | "og_description_over"
  | "og_image_wrong_dimensions"

export type ReadinessIssue = {
  code: ReadinessRuleCode
  severity: ReadinessSeverity
  message: string
  field?: string
}

export type PostReadinessResult = {
  isPublishable: boolean
  issues: ReadinessIssue[]
  blocking: ReadinessIssue[]
  errors: ReadinessIssue[]
  warnings: ReadinessIssue[]
}

export type ReadinessRuleConfig = {
  severity: ReadinessSeverity
  enabledByDefault: boolean
  field?: string
}

export type LengthThresholdRange = {
  under?: number
  over?: number
}

export type LengthThresholds = {
  postTitle?: LengthThresholdRange
  seoTitle?: LengthThresholdRange
  metaDescription?: LengthThresholdRange
  contentSnippet?: LengthThresholdRange
  ogTitle?: LengthThresholdRange
  ogDescription?: LengthThresholdRange
}

export type PostReadinessSettings = {
  validationEnabled?: boolean
  blockOnErrors?: boolean
  enabledRules?: Partial<Record<ReadinessRuleCode, boolean>>
  thresholds?: LengthThresholds
}

export type ReadinessPost = {
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  content?: any[] | null
  category?: string | null
  coverImageUrl?: string | null
  coverImageMediaId?: string | null
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
    ogTitle?: string | null
    ogDescription?: string | null
    ogImage?: {
      url?: string | null
      mediaId?: string | null
    } | null
    canonicalUrl?: string | null
    noindex?: boolean | null
  } | null
}

export const DEFAULT_READINESS_RULES: Record<ReadinessRuleCode, ReadinessRuleConfig> = {
  post_title_missing: {
    severity: "blocking",
    enabledByDefault: true,
    field: "title",
  },
  slug_missing: {
    severity: "blocking",
    enabledByDefault: true,
    field: "slug",
  },
  slug_invalid: {
    severity: "blocking",
    enabledByDefault: true,
    field: "slug",
  },
  featured_image_conditionally_missing: {
    severity: "blocking",
    enabledByDefault: true,
    field: "coverImage",
  },
  content_missing: {
    severity: "blocking",
    enabledByDefault: true,
    field: "content",
  },

  featured_image_wrong_dimensions: {
    severity: "error",
    enabledByDefault: true,
    field: "coverImage",
  },
  featured_image_missing_alt_text: {
    severity: "error",
    enabledByDefault: false,
    field: "coverImage",
  },
  seo_title_missing: {
    severity: "error",
    enabledByDefault: true,
    field: "seo.metaTitle",
  },
  meta_description_missing: {
    severity: "error",
    enabledByDefault: true,
    field: "seo.metaDescription",
  },
  content_snippet_missing: {
    severity: "error",
    enabledByDefault: true,
    field: "excerpt",
  },
  og_title_missing: {
    severity: "error",
    enabledByDefault: true,
    field: "seo.ogTitle",
  },
  og_description_missing: {
    severity: "error",
    enabledByDefault: true,
    field: "seo.ogDescription",
  },
  og_image_missing: {
    severity: "error",
    enabledByDefault: false,
    field: "seo.ogImage",
  },

  post_title_under: {
    severity: "warning",
    enabledByDefault: true,
    field: "title",
  },
  post_title_over: {
    severity: "warning",
    enabledByDefault: true,
    field: "title",
  },
  seo_title_under: {
    severity: "warning",
    enabledByDefault: true,
    field: "seo.metaTitle",
  },
  seo_title_over: {
    severity: "warning",
    enabledByDefault: true,
    field: "seo.metaTitle",
  },
  meta_description_under: {
    severity: "warning",
    enabledByDefault: true,
    field: "seo.metaDescription",
  },
  meta_description_over: {
    severity: "warning",
    enabledByDefault: true,
    field: "seo.metaDescription",
  },
  content_snippet_under: {
    severity: "warning",
    enabledByDefault: true,
    field: "excerpt",
  },
  content_snippet_over: {
    severity: "warning",
    enabledByDefault: true,
    field: "excerpt",
  },
  og_title_under: {
    severity: "warning",
    enabledByDefault: true,
    field: "seo.ogTitle",
  },
  og_title_over: {
    severity: "warning",
    enabledByDefault: true,
    field: "seo.ogTitle",
  },
  og_description_under: {
    severity: "warning",
    enabledByDefault: true,
    field: "seo.ogDescription",
  },
  og_description_over: {
    severity: "warning",
    enabledByDefault: true,
    field: "seo.ogDescription",
  },
  og_image_wrong_dimensions: {
    severity: "warning",
    enabledByDefault: false,
    field: "seo.ogImage.mediaId",
  },
}

function isRuleEnabled(code: ReadinessRuleCode, settings?: PostReadinessSettings) {
  if (settings?.enabledRules && code in settings.enabledRules) {
    return settings.enabledRules[code] ?? DEFAULT_READINESS_RULES[code].enabledByDefault
  }

  return DEFAULT_READINESS_RULES[code].enabledByDefault
}

function createIssue(code: ReadinessRuleCode, message: string): ReadinessIssue {
  const rule = DEFAULT_READINESS_RULES[code]

  return {
    code,
    severity: rule.severity,
    message,
    field: rule.field,
  }
}

function getTextLength(value?: string | null) {
  return value?.trim().length ?? 0
}

function hasContent(content?: any[] | null) {
  return Array.isArray(content) && content.length > 0
}

function hasFeaturedImage(post: ReadinessPost) {
  return Boolean(post.coverImageMediaId || post.coverImageUrl)
}

function getEffectiveOgImageUrl(post: ReadinessPost) {
  return post.seo?.ogImage?.url || post.coverImageUrl || null
}

function requiresFeaturedImage(post: ReadinessPost) {
  return post.category === "blog"
}

function splitIssuesBySeverity(issues: ReadinessIssue[]) {
  return {
    blocking: issues.filter((issue) => issue.severity === "blocking"),
    errors: issues.filter((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
  }
}

async function getFeaturedImageMedia(post: ReadinessPost) {
  if (!post.coverImageMediaId) return null

  return Media.findById(post.coverImageMediaId)
    .select("_id url width height defaultAlt kind status")
    .lean()
}

async function getOgImageMedia(post: ReadinessPost) {
  const mediaId = post.seo?.ogImage?.mediaId
  if (!mediaId) return null

  return Media.findById(mediaId)
    .select("_id url width height defaultAlt kind status")
    .lean()
}

function hasRecommendedOgDimensions(width?: number | null, height?: number | null) {
  return width === 1200 && height === 630
}

function getThreshold(
  settings: PostReadinessSettings | undefined,
  field:
    | "postTitle"
    | "seoTitle"
    | "metaDescription"
    | "contentSnippet"
    | "ogTitle"
    | "ogDescription",
  bound: "under" | "over",
  fallback: number
) {
  return settings?.thresholds?.[field]?.[bound] ?? fallback
}

export async function evaluatePostReadiness(
  post: ReadinessPost,
  settings?: PostReadinessSettings
): Promise<PostReadinessResult> {
  const issues: ReadinessIssue[] = []

  const titleLength = getTextLength(post.title)
  const seoTitleLength = getTextLength(post.seo?.metaTitle)
  const metaDescriptionLength = getTextLength(post.seo?.metaDescription)
  const contentSnippetLength = getTextLength(post.excerpt)
  const ogTitleLength = getTextLength(post.seo?.ogTitle)
  const ogDescriptionLength = getTextLength(post.seo?.ogDescription)

  const featuredImageMedia = await getFeaturedImageMedia(post)
  const ogImageMedia = await getOgImageMedia(post)
  const effectiveOgImageUrl = getEffectiveOgImageUrl(post)

  const postTitleUnder = getThreshold(settings, "postTitle", "under", 30)
  const postTitleOver = getThreshold(settings, "postTitle", "over", 100)

  const seoTitleUnder = getThreshold(settings, "seoTitle", "under", 30)
  const seoTitleOver = getThreshold(settings, "seoTitle", "over", 60)

  const metaDescriptionUnder = getThreshold(settings, "metaDescription", "under", 50)
  const metaDescriptionOver = getThreshold(settings, "metaDescription", "over", 160)

  const contentSnippetUnder = getThreshold(settings, "contentSnippet", "under", 50)
  const contentSnippetOver = getThreshold(settings, "contentSnippet", "over", 220)

  const ogTitleUnder = getThreshold(settings, "ogTitle", "under", 30)
  const ogTitleOver = getThreshold(settings, "ogTitle", "over", 60)

  const ogDescriptionUnder = getThreshold(settings, "ogDescription", "under", 70)
  const ogDescriptionOver = getThreshold(settings, "ogDescription", "over", 180)

  // Blocking

  if (isRuleEnabled("post_title_missing", settings) && titleLength === 0) {
    issues.push(createIssue("post_title_missing", "Post title is required."))
  }

  if (isRuleEnabled("slug_missing", settings) && getTextLength(post.slug) === 0) {
    issues.push(createIssue("slug_missing", "Slug is required."))
  }

  if (
    isRuleEnabled("slug_invalid", settings) &&
    getTextLength(post.slug) > 0 &&
    !isValidSlug(post.slug!.trim())
  ) {
    issues.push(createIssue("slug_invalid", "Slug format is invalid."))
  }

  if (isRuleEnabled("content_missing", settings) && !hasContent(post.content)) {
    issues.push(createIssue("content_missing", "Post content is required."))
  }

  if (
    isRuleEnabled("featured_image_conditionally_missing", settings) &&
    requiresFeaturedImage(post) &&
    !hasFeaturedImage(post)
  ) {
    issues.push(
      createIssue(
        "featured_image_conditionally_missing",
        "A featured image is required for this post type."
      )
    )
  }

  // Errors

  if (
    isRuleEnabled("featured_image_wrong_dimensions", settings) &&
    featuredImageMedia &&
    !hasRecommendedOgDimensions(featuredImageMedia.width, featuredImageMedia.height)
  ) {
    issues.push(
      createIssue(
        "featured_image_wrong_dimensions",
        "Featured image should be 1200 x 630 pixels."
      )
    )
  }

  if (
    isRuleEnabled("featured_image_missing_alt_text", settings) &&
    featuredImageMedia &&
    !getTextLength(featuredImageMedia.defaultAlt)
  ) {
    issues.push(
      createIssue(
        "featured_image_missing_alt_text",
        "Featured image is missing alt text."
      )
    )
  }

  if (isRuleEnabled("seo_title_missing", settings) && seoTitleLength === 0) {
    issues.push(createIssue("seo_title_missing", "SEO title is missing."))
  }

  if (isRuleEnabled("meta_description_missing", settings) && metaDescriptionLength === 0) {
    issues.push(createIssue("meta_description_missing", "Meta description is missing."))
  }

  if (isRuleEnabled("content_snippet_missing", settings) && contentSnippetLength === 0) {
    issues.push(createIssue("content_snippet_missing", "Content snippet is missing."))
  }

  if (isRuleEnabled("og_title_missing", settings) && ogTitleLength === 0) {
    issues.push(createIssue("og_title_missing", "OG title is missing."))
  }

  if (isRuleEnabled("og_description_missing", settings) && ogDescriptionLength === 0) {
    issues.push(createIssue("og_description_missing", "OG description is missing."))
  }

  if (isRuleEnabled("og_image_missing", settings) && !effectiveOgImageUrl) {
    issues.push(createIssue("og_image_missing", "OG image is missing."))
  }

  // Warnings

  if (isRuleEnabled("post_title_under", settings) && titleLength > 0 && titleLength < postTitleUnder) {
    issues.push(
      createIssue(
        "post_title_under",
        `Post title is shorter than the recommended length (${postTitleUnder}+ characters).`
      )
    )
  }

  if (isRuleEnabled("post_title_over", settings) && titleLength > postTitleOver) {
    issues.push(
      createIssue(
        "post_title_over",
        `Post title is longer than the recommended length (${postTitleOver} characters max).`
      )
    )
  }

  if (isRuleEnabled("seo_title_under", settings) && seoTitleLength > 0 && seoTitleLength < seoTitleUnder) {
    issues.push(
      createIssue(
        "seo_title_under",
        `SEO title is shorter than the recommended length (${seoTitleUnder}+ characters).`
      )
    )
  }

  if (isRuleEnabled("seo_title_over", settings) && seoTitleLength > seoTitleOver) {
    issues.push(
      createIssue(
        "seo_title_over",
        `SEO title is longer than the recommended length (${seoTitleOver} characters max).`
      )
    )
  }

  if (
    isRuleEnabled("meta_description_under", settings) &&
    metaDescriptionLength > 0 &&
    metaDescriptionLength < metaDescriptionUnder
  ) {
    issues.push(
      createIssue(
        "meta_description_under",
        `Meta description is shorter than the recommended length (${metaDescriptionUnder}+ characters).`
      )
    )
  }

  if (isRuleEnabled("meta_description_over", settings) && metaDescriptionLength > metaDescriptionOver) {
    issues.push(
      createIssue(
        "meta_description_over",
        `Meta description is longer than the recommended length (${metaDescriptionOver} characters max).`
      )
    )
  }

  if (
    isRuleEnabled("content_snippet_under", settings) &&
    contentSnippetLength > 0 &&
    contentSnippetLength < contentSnippetUnder
  ) {
    issues.push(
      createIssue(
        "content_snippet_under",
        `Content snippet is shorter than the recommended length (${contentSnippetUnder}+ characters).`
      )
    )
  }

  if (isRuleEnabled("content_snippet_over", settings) && contentSnippetLength > contentSnippetOver) {
    issues.push(
      createIssue(
        "content_snippet_over",
        `Content snippet is longer than the recommended length (${contentSnippetOver} characters max).`
      )
    )
  }

  if (isRuleEnabled("og_title_under", settings) && ogTitleLength > 0 && ogTitleLength < ogTitleUnder) {
    issues.push(
      createIssue(
        "og_title_under",
        `OG title is shorter than the recommended length (${ogTitleUnder}+ characters).`
      )
    )
  }

  if (isRuleEnabled("og_title_over", settings) && ogTitleLength > ogTitleOver) {
    issues.push(
      createIssue(
        "og_title_over",
        `OG title is longer than the recommended length (${ogTitleOver} characters max).`
      )
    )
  }

  if (
    isRuleEnabled("og_description_under", settings) &&
    ogDescriptionLength > 0 &&
    ogDescriptionLength < ogDescriptionUnder
  ) {
    issues.push(
      createIssue(
        "og_description_under",
        `OG description is shorter than the recommended length (${ogDescriptionUnder}+ characters).`
      )
    )
  }

  if (isRuleEnabled("og_description_over", settings) && ogDescriptionLength > ogDescriptionOver) {
    issues.push(
      createIssue(
        "og_description_over",
        `OG description is longer than the recommended length (${ogDescriptionOver} characters max).`
      )
    )
  }

  // explicit OG image
  if (
    isRuleEnabled("og_image_wrong_dimensions", settings) &&
    ogImageMedia &&
    !hasRecommendedOgDimensions(ogImageMedia.width, ogImageMedia.height)
  ) {
    issues.push(
      createIssue(
        "og_image_wrong_dimensions",
        "OG image should be 1200 x 630 pixels."
      )
    )
  }

  // fallback OG image from featured image
  if (
    isRuleEnabled("og_image_wrong_dimensions", settings) &&
    !ogImageMedia &&
    featuredImageMedia &&
    effectiveOgImageUrl === featuredImageMedia.url &&
    !hasRecommendedOgDimensions(featuredImageMedia.width, featuredImageMedia.height)
  ) {
    issues.push(
      createIssue(
        "og_image_wrong_dimensions",
        "OG image should be 1200 x 630 pixels."
      )
    )
  }

  const { blocking, errors, warnings } = splitIssuesBySeverity(issues)

  const validationEnabled = settings?.validationEnabled ?? true
  const blockOnErrors = settings?.blockOnErrors ?? false

  const isPublishable = !validationEnabled
    ? true
    : blockOnErrors
      ? blocking.length === 0 && errors.length === 0
      : blocking.length === 0

  return {
    isPublishable,
    issues,
    blocking,
    errors,
    warnings,
  }
}
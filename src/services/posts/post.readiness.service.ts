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

export type PostReadinessSettings = {
  validationEnabled?: boolean
  blockOnErrors?: boolean
  enabledRules?: Partial<Record<ReadinessRuleCode, boolean>>
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
    field: "seo.ogImageUrl",
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
    field: "seo.ogImageUrl",
  },
}
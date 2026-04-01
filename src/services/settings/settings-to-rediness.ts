import { PostReadinessSettings } from "../posts/post.readiness.service"

export function mapSettingsToReadiness(settings: any): PostReadinessSettings {
  return {
    validationEnabled: settings?.publishing?.validationEnabled ?? true,
    blockOnErrors: settings?.publishing?.blockOnErrors ?? false,
    enabledRules: settings?.publishing?.enabledRules
      ? Object.fromEntries(settings.publishing.enabledRules)
      : undefined,
    thresholds: {
      postTitle: settings?.publishing?.characterLimits?.postTitle?.warning,
      seoTitle: settings?.publishing?.characterLimits?.seoTitle?.warning,
      metaDescription: settings?.publishing?.characterLimits?.metaDescription?.warning,
      contentSnippet: settings?.publishing?.characterLimits?.contentSnippet?.warning,
      ogTitle: settings?.publishing?.characterLimits?.ogTitle?.warning,
      ogDescription: settings?.publishing?.characterLimits?.ogDescription?.warning,
    },
  }
}
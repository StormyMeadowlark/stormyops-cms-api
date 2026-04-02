// src/services/settings/settings-to-readiness.ts

import {
  PostReadinessSettings,
  ReadinessRuleCode,
} from "../posts/post.readiness.service"

export function mapSettingsToReadiness(settings: any): PostReadinessSettings {
  const rawEnabledRules = settings?.publishing?.enabledRules

  const enabledRules =
    rawEnabledRules instanceof Map
      ? Object.fromEntries(rawEnabledRules.entries())
      : rawEnabledRules ?? undefined

  return {
    validationEnabled: settings?.publishing?.validationEnabled ?? true,
    blockOnErrors: settings?.publishing?.blockOnErrors ?? false,
    enabledRules: enabledRules as Partial<Record<ReadinessRuleCode, boolean>> | undefined,
    thresholds: {
      postTitle: {
        under: settings?.publishing?.characterLimits?.postTitle?.warning?.under,
        over: settings?.publishing?.characterLimits?.postTitle?.warning?.over,
      },
      seoTitle: {
        under: settings?.publishing?.characterLimits?.seoTitle?.warning?.under,
        over: settings?.publishing?.characterLimits?.seoTitle?.warning?.over,
      },
      metaDescription: {
        under: settings?.publishing?.characterLimits?.metaDescription?.warning?.under,
        over: settings?.publishing?.characterLimits?.metaDescription?.warning?.over,
      },
      contentSnippet: {
        under: settings?.publishing?.characterLimits?.contentSnippet?.warning?.under,
        over: settings?.publishing?.characterLimits?.contentSnippet?.warning?.over,
      },
      ogTitle: {
        under: settings?.publishing?.characterLimits?.ogTitle?.warning?.under,
        over: settings?.publishing?.characterLimits?.ogTitle?.warning?.over,
      },
      ogDescription: {
        under: settings?.publishing?.characterLimits?.ogDescription?.warning?.under,
        over: settings?.publishing?.characterLimits?.ogDescription?.warning?.over,
      },
    },
  }
}
import { z } from "zod"
import { ALL_MEDIA_MIME_TYPES } from "../constants/media"
import { DEFAULT_READINESS_RULES } from "../services/posts/post.readiness.service"

const readinessRuleCodeEnum = z.enum(
  Object.keys(DEFAULT_READINESS_RULES) as [keyof typeof DEFAULT_READINESS_RULES, ...(keyof typeof DEFAULT_READINESS_RULES)[]]
)

const thresholdSchema = z.object({
  under: z.number().int().min(0).max(1000),
  over: z.number().int().min(1).max(1000),
}).refine((v) => v.over >= v.under, {
  message: "over must be greater than or equal to under",
})

export const updateSettingsSchema = z.object({
  site: z.object({
    siteName: z.string().min(1).max(120).optional(),
    domain: z.string().url().optional().or(z.literal("")),
    siteDescription: z.string().max(300).optional(),
    defaultAuthor: z.string().max(120).optional(),
    defaultEmail: z.string().email().optional().or(z.literal("")),
    timezone: z.string().min(1).max(80).optional(),
    maintenanceMode: z.boolean().optional(),
  }).partial().optional(),

  publishing: z.object({
    validationEnabled: z.boolean().optional(),
    blockOnErrors: z.boolean().optional(),
    allowPublishWithWarnings: z.boolean().optional(),
    allowScheduleWithWarnings: z.boolean().optional(),
    enabledRules: z.record(readinessRuleCodeEnum, z.boolean()).optional(),
    characterLimits: z.object({
      postTitle: z.object({ warning: thresholdSchema }).partial().optional(),
      seoTitle: z.object({ warning: thresholdSchema }).partial().optional(),
      metaDescription: z.object({ warning: thresholdSchema }).partial().optional(),
      contentSnippet: z.object({ warning: thresholdSchema }).partial().optional(),
      ogTitle: z.object({ warning: thresholdSchema }).partial().optional(),
      ogDescription: z.object({ warning: thresholdSchema }).partial().optional(),
    }).partial().optional(),
  }).partial().optional(),

  comments: z.object({
    allowOnBlog: z.boolean().optional(),
    allowOnVideo: z.boolean().optional(),
    allowOnAudio: z.boolean().optional(),
    allowOnResource: z.boolean().optional(),
    requireCategoryBeforePublishing: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    autoFlagLanguage: z.boolean().optional(),
    autoFlagSpam: z.boolean().optional(),
    notifyOnFlaggedComment: z.boolean().optional(),
    allowAnonymousComments: z.boolean().optional(),
    notifyAdminOnNewComment: z.boolean().optional(),
    notifyAdminOnReply: z.boolean().optional(),
    autoHideUntilReviewed: z.boolean().optional(),
    moderationStrictness: z.enum(["low", "medium", "high"]).optional(),
  }).partial().optional(),

  seo: z.object({
    metaTitleFormat: z.string().min(1).max(120).optional(),
    useExcerptAsMetaDescriptionFallback: z.boolean().optional(),
    indexSite: z.boolean().optional(),
    showPublishedOrEditedDate: z.boolean().optional(),
  }).partial().optional(),

  content: z.object({
    enableBlogPosts: z.boolean().optional(),
    enableVideoPosts: z.boolean().optional(),
    enableAudioPosts: z.boolean().optional(),
    enableResources: z.boolean().optional(),
    enableCategories: z.boolean().optional(),
    allowCategoryManagement: z.boolean().optional(),
    enableTags: z.boolean().optional(),
    maxTags: z.number().int().min(0).max(50).optional(),
    categories: z.array(z.string().min(1).max(50)).max(100).optional(),
  }).partial().optional(),

  media: z.object({
    allowedMimeTypes: z.array(z.enum(ALL_MEDIA_MIME_TYPES)).optional(),
    maxUploadSizeMb: z.number().int().min(1).max(500).optional(),
    autoThumbnailGeneration: z.boolean().optional(),
    enableAudioTranscription: z.boolean().optional(),
    enableAltTextAi: z.boolean().optional(),
    enableOcr: z.boolean().optional(),
  }).partial().optional(),
})
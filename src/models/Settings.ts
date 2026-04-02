// src/models/Settings.ts

import { Schema, model } from "mongoose"
import { DEFAULT_READINESS_RULES } from "../services/posts/post.readiness.service"

const CharacterRangeSchema = new Schema(
  {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  { _id: false }
)

const SettingsSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    site: {
      siteName: { type: String, default: "StormyOps", trim: true },
      domain: { type: String, default: null, trim: true },
      siteDescription: { type: String, default: null, trim: true },
      defaultAuthor: { type: String, default: null, trim: true },
      defaultEmail: { type: String, default: null, trim: true },
      timezone: { type: String, default: "America/Chicago" },

      defaultOgImage: {
        url: { type: String, default: null, trim: true },
        mediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
      },

      siteLogo: {
        url: { type: String, default: null, trim: true },
        mediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
      },

      favicon: {
        url: { type: String, default: null, trim: true },
        mediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
      },

      maintenanceMode: { type: Boolean, default: false },
    },

    publishing: {
      validationEnabled: { type: Boolean, default: true },
      blockOnErrors: { type: Boolean, default: false },
      allowPublishWithWarnings: { type: Boolean, default: true },
      allowScheduleWithWarnings: { type: Boolean, default: true },
      requireCategoryBeforePublishing: { type: Boolean, default: false },

      requiredFields: {
        title: { type: Boolean, default: true },
        slug: { type: Boolean, default: true },
        content: { type: Boolean, default: true },
        featuredImage: { type: Boolean, default: true },
        seo: { type: Boolean, default: true },
      },

      enabledRules: {
        type: Map,
        of: Boolean,
        default: Object.fromEntries(
          Object.entries(DEFAULT_READINESS_RULES).map(([key, rule]) => [key, rule.enabledByDefault])
        ),
      },

      characterLimits: {
        postTitle: {
          warning: {
            under: { type: Number, default: 30 },
            over: { type: Number, default: 100 },
          },
        },
        seoTitle: {
          warning: {
            under: { type: Number, default: 30 },
            over: { type: Number, default: 60 },
          },
        },
        metaDescription: {
          warning: {
            under: { type: Number, default: 50 },
            over: { type: Number, default: 160 },
          },
        },
        contentSnippet: {
          warning: {
            under: { type: Number, default: 50 },
            over: { type: Number, default: 220 },
          },
        },
        ogTitle: {
          warning: {
            under: { type: Number, default: 30 },
            over: { type: Number, default: 60 },
          },
        },
        ogDescription: {
          warning: {
            under: { type: Number, default: 70 },
            over: { type: Number, default: 180 },
          },
        },
      },
    },

    comments: {
      allowOnBlog: { type: Boolean, default: true },
      allowOnVideo: { type: Boolean, default: true },
      allowOnAudio: { type: Boolean, default: true },
      allowOnResource: { type: Boolean, default: true },

      
      requireApproval: { type: Boolean, default: true },
      autoFlagLanguage: { type: Boolean, default: true },
      autoFlagSpam: { type: Boolean, default: true },
      notifyOnFlaggedComment: { type: Boolean, default: true },
      allowAnonymousComments: { type: Boolean, default: false },
      notifyAdminOnNewComment: { type: Boolean, default: true },
      notifyAdminOnReply: { type: Boolean, default: true },
      autoHideUntilReviewed: { type: Boolean, default: false },
      moderationStrictness: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "high",
      },
    },

    seo: {
      metaTitleFormat: { type: String, default: "[Post Title] | [Site Name]" },
      useExcerptAsMetaDescriptionFallback: { type: Boolean, default: true },
      indexSite: { type: Boolean, default: true },
      showPublishedOrEditedDate: { type: Boolean, default: true },
    },

    content: {
      enableBlogPosts: { type: Boolean, default: true },
      enableVideoPosts: { type: Boolean, default: true },
      enableAudioPosts: { type: Boolean, default: true },
      enableResources: { type: Boolean, default: true },
      enableCategories: { type: Boolean, default: true },
      allowCategoryManagement: { type: Boolean, default: true },
      enableTags: { type: Boolean, default: true },
      maxTags: { type: Number, default: 5 },
      categories: {
        type: [String],
        default: ["blog"],
      },
    },

    media: {
      allowedMimeTypes: {
        type: [String],
        default: [],
      },
      maxUploadSizeMb: { type: Number, default: 100 },
      autoThumbnailGeneration: { type: Boolean, default: true },
      enableAudioTranscription: { type: Boolean, default: true },
      enableAltTextAi: { type: Boolean, default: true },
      enableOcr: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
)

export const Settings = model("Settings", SettingsSchema)
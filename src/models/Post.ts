import { Schema, model, Types } from "mongoose"

type PostStatus = "draft" | "scheduled" | "published" | "archived"

const ContentBlockSchema = new Schema(
  {
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
)

const SeoSchema = new Schema(
  {
    metaTitle: String,
    metaDescription: String,
    ogTitle: String,
    ogDescription: String,
    ogImageUrl: String,
    canonicalUrl: String,
    noindex: { type: Boolean, default: false },
  },
  { _id: false }
)

const PostSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
    },

    excerpt: {
      type: String,
      trim: true,
    },

    content: {
      type: [ContentBlockSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "archived"],
      default: "draft",
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    scheduledFor: {
      type: Date,
      default: null,
    },

    seo: {
      type: SeoSchema,
      default: {},
    },

    tags: {
      type: [String],
      default: [],
      index: true,
    },
    category: {
       type: String,
       default: "blog",
       trim: true
      },
    commentsEnabled: {
      type: Boolean,
      default: true 
    },
    
    coverImageUrl: { type: String, default: null },
    coverImageMediaId: { type: Types.ObjectId, ref: "Media", default: null },
    requireValidationToPublish: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false, index: true },
    featuredRank: { type: Number, default: 0, index: true }, // lower = higher
    featuredExpiresAt: { type: Date, default: null },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
)

/**
 * Enforce unique slug PER tenant
 */
PostSchema.index({ tenantId: 1, slug: 1 }, { unique: true })

/**
 * Helpful compound index for blog listing
 */
PostSchema.index({ tenantId: 1, isFeatured: 1, status: 1, publishedAt: -1 })

/**
 * Fast featured listing (homepage)
 */
PostSchema.index({ tenantId: 1, isFeatured: 1, featuredRank: 1 })

export const Post = model("Post", PostSchema)
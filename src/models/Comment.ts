// src/models/Comment.ts

import { Schema, model, Types } from "mongoose"

export type CommentStatus =
  | "pending"
  | "approved"
  | "hidden"
  | "flagged"
  | "deleted"
  | "spam"

export type CommentFlagReason =
  | "language"
  | "spam"
  | "abuse"
  | "promo"
  | "link"
  | "manual"
  | null

const CommentSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    postId: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    parentCommentId: {
      type: Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    /**
     * Anonymous comments are allowed depending on tenant settings.
     * Do not require authorName at the model level.
     */
    authorName: {
      type: String,
      trim: true,
      default: null,
    },

    /**
     * Do not store raw public commenter emails.
     *
     * The public API may accept `authorEmail`,
     * but the service layer should encrypt it into authorEmailEncrypted
     * and store a hash in authorEmailHash for lookup/deduping.
     */
    authorEmailEncrypted: {
      type: String,
      default: null,
      select: false,
    },

    authorEmailHash: {
      type: String,
      default: null,
      index: true,
      select: false,
    },

    authorEmailProvided: {
      type: Boolean,
      default: false,
    },

    isAnonymous: {
      type: Boolean,
      default: true,
      index: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "hidden", "flagged", "deleted", "spam"],
      default: "pending",
      index: true,
    },

    flagReason: {
      type: String,
      enum: ["language", "spam", "abuse", "promo", "link", "manual"],
      default: null,
      index: true,
    },

    /**
     * Optional public notification preferences.
     * These only matter if an email was provided and encrypted.
     */
    notifyOnReplyToComment: {
      type: Boolean,
      default: false,
    },

    notifyOnThreadActivity: {
      type: Boolean,
      default: false,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastRepliedAt: {
      type: Date,
      default: null,
    },

    replyCount: {
      type: Number,
      default: 0,
    },
    
    commenterSessionHash: {
        type: String,
        required: true,
        index: true,
        select: false,
    },

    isEdited: {
        type: Boolean,
        default: false,
    },

    editedAt: {
        type: Date,
        default: null,
    },

    editCount: {
        type: Number,
        default: 0,
    },

    lastEditedBy: {
        type: String,
        enum: ["commenter", "admin", null],
        default: null,
    },

    editHistory: {
    type: [
        {
        body: { type: String, required: true },
        editedAt: { type: Date, required: true },
        editedBy: {
            type: String,
            enum: ["commenter", "admin"],
            required: true,
        },
        },
    ],
    default: [],
    select: false,
    },

    sourceUrl: {
        type: String,
        trim: true,
        default: null,
    },

    website: {
        type: String,
        trim: true,
        default: null,
    },

    honeypotTriggered: {
        type: Boolean,
        default: false,
        index: true,
    },

  },
  { timestamps: true }
)

CommentSchema.index({ tenantId: 1, postId: 1, createdAt: -1 })
CommentSchema.index({ tenantId: 1, postId: 1, status: 1, createdAt: -1 })
CommentSchema.index({ tenantId: 1, status: 1, createdAt: -1 })
CommentSchema.index({ tenantId: 1, parentCommentId: 1, createdAt: 1 })
CommentSchema.index({ tenantId: 1, authorEmailHash: 1 })
CommentSchema.index({ tenantId: 1, commenterSessionHash: 1, createdAt: -1 })

export const Comment = model("Comment", CommentSchema)
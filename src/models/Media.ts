// src/models/Media.ts

import { Schema, model, Types } from "mongoose"

export type MediaKind = "image" | "document" | "audio" | "video"
export type MediaStatus = "pending" | "ready" | "failed" | "deleted"

const MediaSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    kind: {
      type: String,
      enum: ["image", "document", "audio", "video"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "ready", "failed", "deleted"],
      default: "pending",
      index: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    originalFileName: {
      type: String,
      trim: true,
      default: null,
    },

    displayName: {
      type: String,
      trim: true,
      default: null,
    },

    mimeType: {
      type: String,
      required: true,
      index: true,
    },

    extension: {
      type: String,
      trim: true,
      default: null,
    },

    size: {
      type: Number,
      default: 0,
    },

    storageProvider: {
      type: String,
      enum: ["local", "s3", "r2", "do-spaces"],
      default: "do-spaces",
    },

    storageKey: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration: { type: Number, default: null },

    defaultAlt: {
      type: String,
      trim: true,
      default: null,
    },

    defaultCaption: {
      type: String,
      trim: true,
      default: null,
    },

    uploadedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    deletedAt: { 
        type: Date, 
        default: null 
    },

    deletedBy: { 
        type: Types.ObjectId,
        ref: "User",
        default: null
    },
  },
  { timestamps: true }
)

MediaSchema.index({ tenantId: 1, kind: 1, createdAt: -1 })
MediaSchema.index({ tenantId: 1, status: 1, createdAt: -1 })
MediaSchema.index({ tenantId: 1, storageKey: 1 }, { unique: true })

export const Media = model("Media", MediaSchema)
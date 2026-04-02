import { Request, Response, NextFunction } from "express"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"
import { spacesClient } from "../config/spaces"
import { createMediaUploadSchema } from "../validation/media.upload.validation"
import { getMediaKindFromMimeType, sanitizeFileName } from "../utils/media"
import { getOrCreateSettings } from "../services/settings/settings.service"

export async function createAdminMediaUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const bucket = process.env.DO_SPACES_BUCKET
    const cdnBaseUrl = process.env.DO_SPACES_CDN_BASE_URL

    if (!bucket) throw new Error("DO_SPACES_BUCKET is missing")
    if (!cdnBaseUrl) throw new Error("DO_SPACES_CDN_BASE_URL is missing")

    const body = createMediaUploadSchema.parse(req.body)

    const settings = await getOrCreateSettings(tenantId)

    const allowedMimeTypes =
      Array.isArray(settings?.media?.allowedMimeTypes) &&
      settings.media.allowedMimeTypes.length > 0
        ? settings.media.allowedMimeTypes
        : null

    if (allowedMimeTypes && !allowedMimeTypes.includes(body.mimeType)) {
      throw Object.assign(
        new Error(`Uploads of type "${body.mimeType}" are not allowed by settings`),
        { status: 409 }
      )
    }

    const maxUploadSizeMb = settings?.media?.maxUploadSizeMb ?? 100
    const maxUploadSizeBytes = maxUploadSizeMb * 1024 * 1024

    if (body.size > maxUploadSizeBytes) {
      throw Object.assign(
        new Error(`File exceeds tenant upload limit of ${maxUploadSizeMb} MB`),
        { status: 409 }
      )
    }

    const kind = getMediaKindFromMimeType(body.mimeType)

    const ext = body.fileName.includes(".")
      ? body.fileName.split(".").pop()?.toLowerCase() || ""
      : ""

    const baseName = sanitizeFileName(body.fileName.replace(/\.[^/.]+$/, ""))
    const unique = crypto.randomUUID()

    const storageKey = `tenants/${tenantId}/media/${kind}/${unique}-${baseName}${ext ? `.${ext}` : ""}`

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: body.mimeType,
      ACL: "public-read",
    })

    const uploadUrl = await getSignedUrl(spacesClient, command, {
      expiresIn: 60 * 5,
    })

    const publicUrl = `${cdnBaseUrl}/${storageKey}`

    return res.status(201).json({
      uploadUrl,
      expiresIn: 300,
      file: {
        kind,
        fileName: body.fileName,
        mimeType: body.mimeType,
        size: body.size,
        extension: ext || null,
        storageProvider: "do-spaces",
        storageKey,
        url: publicUrl,
      },
    })
  } catch (err) {
    next(err)
  }
}
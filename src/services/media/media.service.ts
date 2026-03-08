import { Types } from "mongoose"
import { Media } from "../../models/Media"

function isDuplicateKeyError(err: any) {
  return err && (err.code === 11000 || err.codeName === "DuplicateKey")
}

function toObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) return null
  return new Types.ObjectId(id)
}

export async function createMedia(params: {
  tenantId: string
  userId: string
  data: any
}) {
  try {
    const doc = await Media.create({
      tenantId: params.tenantId,
      kind: params.data.kind,
      status: "ready",
      fileName: params.data.fileName,
      originalFileName: params.data.originalFileName ?? null,
      displayName: params.data.displayName ?? null,
      mimeType: params.data.mimeType,
      extension: params.data.extension ?? null,
      size: params.data.size ?? 0,
      storageProvider: params.data.storageProvider ?? "do-spaces",
      storageKey: params.data.storageKey,
      url: params.data.url,
      width: params.data.width ?? null,
      height: params.data.height ?? null,
      duration: params.data.duration ?? null,
      defaultAlt: params.data.defaultAlt ?? null,
      defaultCaption: params.data.defaultCaption ?? null,
      uploadedBy: params.userId,
    })

    return doc
  } catch (err: any) {
    if (isDuplicateKeyError(err)) {
      throw Object.assign(new Error("Media storageKey already exists"), { status: 409 })
    }
    throw err
  }
}

export async function listMedia(params: {
  tenantId: string
  kind?: string
  status?: string
  q?: string
  page?: number
  limit?: number
}) {
  const limit = Math.min(Math.max(Number(params.limit || 24), 1), 100)
  const page = Math.max(Number(params.page || 1), 1)
  const skip = (page - 1) * limit

  const filter: any = {
    tenantId: params.tenantId,
  }

  if (params.kind) filter.kind = params.kind
  if (params.status) {
    filter.status = params.status
  } else {
    filter.status = { $ne: "deleted" }
  }

  if (params.q) {
    const re = new RegExp(params.q, "i")
    filter.$or = [
      { fileName: re },
      { originalFileName: re },
      { displayName: re },
      { mimeType: re },
      { defaultAlt: re },
      { defaultCaption: re },
    ]
  }

  const [items, total] = await Promise.all([
    Media.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Media.countDocuments(filter),
  ])

  return { items, total, page, limit }
}

export async function getMediaById(params: {
  tenantId: string
  id: string
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const doc = await Media.findOne({
    _id: oid,
    tenantId: params.tenantId,
  }).lean()

  if (!doc || doc.status === "deleted") {
    throw Object.assign(new Error("Not found"), { status: 404 })
  }

  return doc
}

export async function updateMedia(params: {
  tenantId: string
  id: string
  data: {
    displayName?: string
    defaultAlt?: string | null
    defaultCaption?: string | null
  }
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const update: any = {}

  if (params.data.displayName !== undefined) {
    update.displayName = params.data.displayName
  }

  if (params.data.defaultAlt !== undefined) {
    update.defaultAlt = params.data.defaultAlt
  }

  if (params.data.defaultCaption !== undefined) {
    update.defaultCaption = params.data.defaultCaption
  }

  const doc = await Media.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      status: { $ne: "deleted" },
    },
    { $set: update },
    { new: true }
  ).lean()

  if (!doc) throw Object.assign(new Error("Not found"), { status: 404 })
  return doc
}

export async function deleteMedia(params: {
  tenantId: string
  id: string
}) {
  const oid = toObjectId(params.id)
  if (!oid) throw Object.assign(new Error("Invalid id"), { status: 400 })

  const doc = await Media.findOneAndUpdate(
    {
      _id: oid,
      tenantId: params.tenantId,
      status: { $ne: "deleted" },
    },
    {
      $set: {
        status: "deleted",
      },
    },
    { new: true }
  ).lean()

  if (!doc) throw Object.assign(new Error("Not found"), { status: 404 })

  return { ok: true }
}
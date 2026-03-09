import { Request, Response, NextFunction } from "express"
import {
  createMediaSchema,
  updateMediaSchema,
  listMediaQuerySchema,
} from "../validation/media.validation"
import {
  createMedia,
  listMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  purgeMedia,
} from "../services/media/media.service"

export async function createAdminMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const data = createMediaSchema.parse(req.body)

    const doc = await createMedia({
      tenantId,
      userId: user.id,
      data,
    })

    return res.status(201).json(doc)
  } catch (err) {
    next(err)
  }
}

export async function listAdminMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const parsed = listMediaQuerySchema.parse(req.query)

    const result = await listMedia({
      tenantId,
      kind: parsed.kind,
      status: parsed.status,
      q: parsed.q,
      page: parsed.page,
      limit: parsed.limit,
    })

    return res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getAdminMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    const doc = await getMediaById({ tenantId, id })
    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

export async function patchAdminMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    const data = updateMediaSchema.parse(req.body)

    const doc = await updateMedia({
      tenantId,
      id,
      data,
    })

    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

export async function deleteAdminMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    const result = await deleteMedia({
      tenantId,
      userId: user.id,
      id,
    })

    return res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function purgeAdminMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    const result = await purgeMedia({
      tenantId,
      id,
    })

    return res.json(result)
  } catch (err) {
    next(err)
  }
}
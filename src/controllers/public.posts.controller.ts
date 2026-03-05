import { Request, Response, NextFunction } from "express"
import { listPublicPosts, getPublicPostBySlug, listFeaturedPosts } from "../services/posts/posts.service"

export async function getPublicPosts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = (req as any).tenantId
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant missing" })
    }

    const { page, limit, tag } = req.query

    const result = await listPublicPosts({
      tenantId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      tag: tag ? String(tag) : undefined,
    })

    return res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getPublicFeaturedPosts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = (req as any).tenantId
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const limitQ = req.query.limit
    const limit = Array.isArray(limitQ) ? Number(limitQ[0]) : limitQ ? Number(limitQ) : undefined

    const result = await listFeaturedPosts({ tenantId, limit })
    return res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getPublicPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const slugParam = req.params.slug

    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
    if (!slug) return res.status(400).json({ message: "Slug required" })

    const post = await getPublicPostBySlug({ tenantId, slug })

    return res.json(post)
  } catch (err) {
    next(err)
  }
}
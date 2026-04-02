// src/controllers/admin.posts.controller.ts

import { Request, Response, NextFunction } from "express"
import { adminPatchSchema, createPostSchema } from "../validation/post.validation"
import { createPost, getAdminPostById, listAdminPosts, updatePost, deletePost, publishPost, unpublishPost, archivePost, unarchivePost, schedulePost } from "../services/posts/posts.service"
import { scheduleSchema } from "../validation/schedule.validation"
import { enqueuePublishJob, removePublishJob } from "../jobs/publishJobs"

// POST /api/v1/posts
export async function createAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const data = createPostSchema.parse(req.body)

    const doc = await createPost({
      tenantId,
      userId: user.id,
      data,
    })

    return res.status(201).json(doc)
  } catch (err) {
    next(err)
  }
}

//GET /api/v1/admin/posts/:id
export async function getAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    const doc = await getAdminPostById({ tenantId, id })
    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/admin/posts?q=&status=&page=&limit=
export async function listAdminPostsController(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const qParam = req.query.q
    const statusParam = req.query.status
    const pageParam = req.query.page
    const limitParam = req.query.limit

    const q = Array.isArray(qParam) ? qParam[0] : qParam
    const status = Array.isArray(statusParam) ? statusParam[0] : statusParam

    const pageStr = Array.isArray(pageParam) ? pageParam[0] : pageParam
    const limitStr = Array.isArray(limitParam) ? limitParam[0] : limitParam

    const page = pageStr ? Number(pageStr) : undefined
    const limit = limitStr ? Number(limitStr) : undefined

    const result = await listAdminPosts({
      tenantId,
      q: q ? String(q) : undefined,
      status: status ? String(status) : undefined,
      page,
      limit,
    })

    return res.json(result)
  } catch (err) {
    next(err)
  }
}

// PATCH /api/v1/admin/posts/:id
export async function patchAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    const data = adminPatchSchema.parse(req.body)

    const doc = await updatePost({
      tenantId,
      userId: user.id,
      id,
      data,
    })

    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

// DELETE /api/v1/admin/posts/:id
export async function deleteAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    await removePublishJob(tenantId, id)
    
    const result = await deletePost({
      tenantId,
      id,
    })

    return res.json(result)
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/admin/posts/:id/publish
export async function publishAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    await removePublishJob(tenantId, id)

    const doc = await publishPost({ tenantId, userId: user.id, id })
    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/admin/posts/:id/unpublish
export async function unpublishAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    await removePublishJob(tenantId, id)

    const doc = await unpublishPost({ tenantId, userId: user.id, id })
    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/admin/posts/:id/archive
export async function archiveAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    await removePublishJob(tenantId, id)

    const doc = await archivePost({ tenantId, userId: user.id, id })
    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/admin/posts/:id/unarchive
export async function unarchiveAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    const doc = await unarchivePost({ tenantId, userId: user.id, id })
    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/admin/posts/:id/schedule
export async function scheduleAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const user = (req as any).user as { id: string } | undefined
    if (!user?.id) return res.status(401).json({ message: "Not authenticated" })

    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    if (!id) return res.status(400).json({ message: "Id required" })

    const body = scheduleSchema.parse(req.body)
    const when = new Date(body.scheduledFor)
    if (isNaN(when.getTime())) return res.status(400).json({ message: "Invalid scheduledFor" })

    // Require it to be in the future (small buffer avoids "publish instantly" by mistake)
    if (when.getTime() < Date.now() + 5000) {
      return res.status(400).json({ message: "scheduledFor must be in the future" })
    }

    // 1) DB is source of truth
    const doc = await schedulePost({
      tenantId,
      userId: user.id,
      id,
      scheduledFor: when,
    })

    // 2) Replace any existing job
    await removePublishJob(tenantId, id)
    await enqueuePublishJob({
      tenantId,
      userId: user.id,
      postId: id,
      scheduledFor: when,
    })

    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

export async function getAdminPostReadiness(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const id = req.params.id
    if (!id) return res.status(400).json({ message: "Id required" })

    const post = await getAdminPostById({ tenantId, id })
    const settings = await getOrCreateSettings(tenantId)
    const readinessSettings = mapSettingsToReadiness(settings)
    const result = await evaluatePostReadiness(post, readinessSettings)

    return res.json(result)
  } catch (err) {
    next(err)
  }
}
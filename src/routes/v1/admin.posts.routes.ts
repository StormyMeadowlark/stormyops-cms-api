// src/routes/v1/admin.posts.routes.ts

import { Router } from "express"
import { requireTenant } from "../../middleware/requireTenant"
import { requireAuth } from "../../middleware/requireAuth"
import { requireRole } from "../../middleware/requireRole"
import { listAdminPostsController, getAdminPost, createAdminPost, patchAdminPost, deleteAdminPost, publishAdminPost, unpublishAdminPost, archiveAdminPost, unarchiveAdminPost, scheduleAdminPost, getAdminPostReadiness } from "../../controllers/admin.posts.controller"

const router = Router()

// GET /api/v1/admin/posts
router.get("/", requireTenant, requireAuth, requireRole("admin", "editor"), listAdminPostsController)

// GET /api/v1/admin/posts/:id
router.get("/:id", requireTenant, requireAuth, requireRole("admin", "editor"), getAdminPost)

// POST /api/v1/admin/posts
router.post("/", requireTenant, requireAuth, requireRole("admin", "editor"), createAdminPost)

// PATCH /api/v1/admin/posts/:id
router.patch("/:id", requireTenant, requireAuth, requireRole("admin", "editor"), patchAdminPost)

// DELETE /api/v1/admin/posts/:id
router.delete(
  "/:id", requireTenant, requireAuth, requireRole("admin", "editor"), deleteAdminPost
)

// POST /api/v1/admin/posts/:id/publish
router.post("/:id/publish", requireTenant, requireAuth, requireRole("admin", "editor"), publishAdminPost)

// POST /api/v1/admin/posts/:id/unpublish
router.post("/:id/unpublish", requireTenant, requireAuth, requireRole("admin", "editor"), unpublishAdminPost)

// POST /api/v1/admin/posts/:id/archive
router.post("/:id/archive", requireTenant, requireAuth, requireRole("admin", "editor"), archiveAdminPost)

// POST /api/v1/admin/posts/:id/unarchive
router.post("/:id/unarchive", requireTenant, requireAuth, requireRole("admin", "editor"), unarchiveAdminPost)

// POST /api/v1/admin/posts/:id/schedule
router.post("/:id/schedule", requireTenant, requireAuth, requireRole("admin", "editor"), scheduleAdminPost)

// GET /api/v1/admin/posts/:id/readiness
router.get("/:id/readiness", requireTenant, requireAuth, requireRole("admin", "editor"), getAdminPostReadiness)

export default router
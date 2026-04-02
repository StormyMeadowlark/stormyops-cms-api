// src/routes/v1/admin.media.routes.ts

import { Router } from "express"
import { requireTenant } from "../../middleware/requireTenant"
import { requireAuth } from "../../middleware/requireAuth"
import { requireRole } from "../../middleware/requireRole"
import {
  createAdminMedia,
  listAdminMedia,
  getAdminMedia,
  patchAdminMedia,
  deleteAdminMedia,
  purgeAdminMedia,
} from "../../controllers/media.controller"

const router = Router()

router.get(
  "/",
  requireTenant,
  requireAuth,
  requireRole("admin", "editor"),
  listAdminMedia
)

router.get(
  "/:id",
  requireTenant,
  requireAuth,
  requireRole("admin", "editor"),
  getAdminMedia
)

router.post(
  "/",
  requireTenant,
  requireAuth,
  requireRole("admin", "editor"),
  createAdminMedia
)

router.patch(
  "/:id",
  requireTenant,
  requireAuth,
  requireRole("admin", "editor"),
  patchAdminMedia
)

router.delete(
  "/:id",
  requireTenant,
  requireAuth,
  requireRole("admin", "editor"),
  deleteAdminMedia
)

router.delete(
  "/:id/purge",
  requireTenant,
  requireAuth,
  requireRole("admin"),
  purgeAdminMedia
)


export default router
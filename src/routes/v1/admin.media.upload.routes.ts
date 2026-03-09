import { Router } from "express"
import { requireTenant } from "../../middleware/requireTenant"
import { requireAuth } from "../../middleware/requireAuth"
import { requireRole } from "../../middleware/requireRole"
import { createAdminMediaUpload } from "../../controllers/media.upload.controller"

const router = Router()

router.post(
  "/presign",
  requireTenant,
  requireAuth,
  requireRole("admin", "editor"),
  createAdminMediaUpload
)

export default router
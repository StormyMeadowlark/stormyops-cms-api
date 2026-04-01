import { Router } from "express"
import { requireTenant } from "../../middleware/requireTenant"
import { requireAuth } from "../../middleware/requireAuth"
import { requireRole } from "../../middleware/requireRole"
import {
  getAdminSettings,
  patchAdminSettings,
  resetAdminSettings,
} from "../../controllers/settings.controller"

const router = Router()

router.get("/", requireTenant, requireAuth, requireRole("admin", "editor"), getAdminSettings)
router.patch("/", requireTenant, requireAuth, requireRole("admin"), patchAdminSettings)
router.post("/reset", requireTenant, requireAuth, requireRole("admin"), resetAdminSettings)

export default router
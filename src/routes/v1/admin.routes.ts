import { Router } from "express"
import { requireAuth } from "../../middleware/requireAuth"

const router = Router()

router.get("/whoami", requireAuth, (req, res) => {
  res.json({ user: (req as any).user })
})

export default router
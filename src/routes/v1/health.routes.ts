import { Router } from "express"
import { liveHealth, readyHealth } from "../../controllers/health.controller"

const router = Router()

router.get("/", readyHealth)
router.get("/live", liveHealth)
router.get("/ready", readyHealth)

export default router
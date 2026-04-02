// src/routes/v1/public.posts.routes.ts

import { Router } from "express"
import { requireTenant } from "../../middleware/requireTenant"
import { getPublicPosts, getPublicFeaturedPosts, getPublicPost } from "../../controllers/public.posts.controller"

const router = Router()

router.get("/", requireTenant, getPublicPosts)
router.get("/featured", requireTenant, getPublicFeaturedPosts)
router.get("/:slug", requireTenant, getPublicPost)

export default router
// src/routes/v1/auth.routes.ts

import { Router } from "express"
import { login, logout, me } from "../../controllers/auth.controller"

const router = Router()

router.post("/login", (req, res, next) => login(req, res).catch(next))
router.post("/logout", (req, res, next) => logout(req, res).catch(next))
router.get("/me", (req, res, next) => me(req, res).catch(next))

export default router
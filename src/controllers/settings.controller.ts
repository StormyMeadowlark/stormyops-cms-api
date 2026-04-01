import { Request, Response, NextFunction } from "express"
import { getOrCreateSettings, updateSettings, resetSettings } from "../services/settings/settings.service"
import { updateSettingsSchema } from "../validation/settings.validation"

export async function getAdminSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const doc = await getOrCreateSettings(tenantId)
    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

export async function patchAdminSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const data = updateSettingsSchema.parse(req.body)
    const doc = await updateSettings(tenantId, data)

    return res.json(doc)
  } catch (err) {
    next(err)
  }
}

export async function resetAdminSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined
    if (!tenantId) return res.status(400).json({ message: "Tenant missing" })

    const doc = await resetSettings(tenantId)
    return res.json(doc)
  } catch (err) {
    next(err)
  }
}
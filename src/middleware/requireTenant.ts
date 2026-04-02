// src/middleware/requireTenants.ts

import { Request, Response, NextFunction } from "express"

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const headerTenant = (req.headers["x-tenant"] as string | undefined)?.trim()
  const queryTenant = (req.query.tenantId as string | undefined)?.trim()

  const tenantId = headerTenant || queryTenant || process.env.TENANT_ID

  if (!tenantId) {
    return res.status(400).json({ message: "Missing tenantId (use X-Tenant or tenantId query)" })
  }

  ;(req as any).tenantId = tenantId
  next()
}
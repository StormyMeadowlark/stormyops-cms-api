import { Settings } from "../../models/Settings"

function normalizeSettings(doc: any) {
  if (!doc) return doc

  const settings = typeof doc.toObject === "function" ? doc.toObject() : { ...doc }

  const enabledRules = settings?.publishing?.enabledRules

  if (enabledRules instanceof Map) {
    settings.publishing.enabledRules = Object.fromEntries(enabledRules)
  }

  return settings
}

export async function getOrCreateSettings(tenantId: string) {
  let doc = await Settings.findOne({ tenantId })

  if (!doc) {
    doc = await Settings.create({ tenantId })
  }

  return normalizeSettings(doc)
}

export async function updateSettings(tenantId: string, patch: any) {
  const doc = await Settings.findOneAndUpdate(
    { tenantId },
    { $set: patch },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  )

  return normalizeSettings(doc)
}

export async function resetSettings(tenantId: string) {
  await Settings.deleteOne({ tenantId })
  const doc = await Settings.create({ tenantId })
  return normalizeSettings(doc)
}
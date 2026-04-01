import { Settings } from "../../models/Settings"

export async function getOrCreateSettings(tenantId: string) {
  let doc = await Settings.findOne({ tenantId }).lean()

  if (!doc) {
    const created = await Settings.create({
      tenantId,
      media: {
        allowedMimeTypes: [],
      },
    })
    doc = created.toObject()
  }

  return doc
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
  ).lean()

  return doc
}

export async function resetSettings(tenantId: string) {
  await Settings.deleteOne({ tenantId })
  return getOrCreateSettings(tenantId)
}
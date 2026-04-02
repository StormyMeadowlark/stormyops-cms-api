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

function normalizeMediaField(value: any) {
  if (!value || typeof value !== "object") return value

  return {
    url: typeof value.url === "string" && value.url.trim() ? value.url.trim() : null,
    mediaId: typeof value.mediaId === "string" && value.mediaId.trim() ? value.mediaId.trim() : null,
  }
}

function flattenForDotNotation(
  obj: Record<string, any>,
  prefix = ""
): Record<string, any> {
  const output: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (value === undefined) continue

    const isPlainObject =
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)

    if (isPlainObject) {
      Object.assign(output, flattenForDotNotation(value, path))
    } else {
      output[path] = value
    }
  }

  return output
}

export async function getOrCreateSettings(tenantId: string) {
  let doc = await Settings.findOne({ tenantId })

  if (!doc) {
    doc = await Settings.create({ tenantId })
  }

  return normalizeSettings(doc)
}

export async function updateSettings(tenantId: string, patch: any) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw Object.assign(new Error("Invalid settings patch"), { status: 400 })
  }

  if (patch.site?.defaultOgImage !== undefined) {
    patch.site.defaultOgImage = normalizeMediaField(patch.site.defaultOgImage)
  }

  if (patch.site?.siteLogo !== undefined) {
    patch.site.siteLogo = normalizeMediaField(patch.site.siteLogo)
  }

  if (patch.site?.favicon !== undefined) {
    patch.site.favicon = normalizeMediaField(patch.site.favicon)
  }

  const flattenedPatch = flattenForDotNotation(patch)

  const doc = await Settings.findOneAndUpdate(
    { tenantId },
    {
      $set: {
        tenantId,
        ...flattenedPatch,
      },
    },
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
// src/validation/schedule.validation.ts

import { z } from "zod"

export const scheduleSchema = z.object({
  scheduledFor: z
    .string()
    .refine(
      (s) => /z$/i.test(s) || /[+-]\d{2}:\d{2}$/.test(s),
      "scheduledFor must include timezone offset (Z or ±HH:MM)"
    ),
})
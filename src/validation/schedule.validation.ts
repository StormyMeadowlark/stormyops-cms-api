import { z } from "zod"

export const scheduleSchema = z.object({
  scheduledFor: z.string().datetime(),
})
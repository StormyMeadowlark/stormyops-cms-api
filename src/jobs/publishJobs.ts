import { publishQueue } from "./queues/publish.queue"

export function publishJobId(tenantId: string, postId: string) {
  return `publish:${tenantId}:${postId}`
}

export async function removePublishJob(tenantId: string, postId: string) {
  const job = await publishQueue.getJob(publishJobId(tenantId, postId))
  if (job) await job.remove()
}

export async function enqueuePublishJob(params: {
  tenantId: string
  userId: string
  postId: string
  scheduledFor: Date
}) {
  const delay = params.scheduledFor.getTime() - Date.now()

  await publishQueue.add(
    "publish",
    {
      tenantId: params.tenantId,
      userId: params.userId,
      postId: params.postId,
    },
    {
      delay,
      jobId: publishJobId(params.tenantId, params.postId),
      removeOnComplete: true,
    }
  )
}
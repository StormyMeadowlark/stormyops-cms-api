import { Worker } from "bullmq"
import { bullConnection } from "../connection"
import { publishPost } from "../../services/posts/posts.service"
import { Post } from "../../models/Post"

export const publishWorker = new Worker(
  "publish-post",
  async (job) => {
    console.log("Publishing job:", {
      id: job.id,
      name: job.name,
      data: job.data,
    })

    const { tenantId, userId, postId } = job.data

    const doc = await Post.findOne({ _id: postId, tenantId }).lean()

    if (!doc) {
      console.warn("Publish job skipped: post not found", {
        jobId: job.id,
        tenantId,
        postId,
      })
      return
    }

    if (doc.status !== "scheduled") {
      console.warn("Publish job skipped: post is not scheduled", {
        jobId: job.id,
        tenantId,
        postId,
        status: doc.status,
      })
      return
    }

    await publishPost({ tenantId, userId, id: postId })
  },
  { connection: bullConnection }
)

publishWorker.on("completed", (job) => {
  console.log("Publish job completed", {
    jobId: job.id,
    name: job.name,
    data: job.data,
  })
})

publishWorker.on("failed", (job, err) => {
  console.error("Publish job failed", {
    jobId: job?.id,
    name: job?.name,
    data: job?.data,
    error: err.message,
    stack: err.stack,
  })
})

publishWorker.on("error", (err) => {
  console.error("Publish worker error", {
    error: err.message,
    stack: err.stack,
  })
})
import { Worker } from "bullmq"
import { bullConnection } from "../connection"
import { publishPost } from "../../services/posts/posts.service"
import { Post } from "../../models/Post"

export const publishWorker = new Worker(
  "publish-post",
  async (job) => {
    const { tenantId, userId, postId } = job.data

    const doc = await Post.findOne({ _id: postId, tenantId }).lean()

    if (!doc) return
    if (doc.status !== "scheduled") return

    await publishPost({ tenantId, userId, id: postId })
  },
  { connection: bullConnection }
)
const db = require("../src/DB")
const FF = require("./FF")
const util = require("./util")

class JobQueue {

    constructor() {
        this.jobs = []
        this.currentJob = null

        // loop through the videos and find all the processing true items
        // and add it to the queue
        db.update()
        db.videos.forEach(vid => {
            Object.keys(vid.resizes).forEach(key => {

                if (vid.resizes[key].processing) {
                    const [width, height] = key.split("x")
                    this.enqueue({
                        type: "resize",
                        videoId: vid.videoId,
                        width,
                        height,
                    })
                }
            })
        })
    }

    enqueue(job) {
        this.jobs.push(job)
        this.executeNext()
    }

    dequeue() {
        return this.jobs.shift()
    }

    executeNext() {
        if (this.currentJob) {
            return
        }
        this.currentJob = this.dequeue()

        if (!this.currentJob) {
            return
        }
        this.execute(this.currentJob)
    }

    async execute(job) {

        if (job.type === "resize") {
            const { videoId, width, height } = job
            db.update()
            const video = db.videos.find(vid => vid.videoId === videoId)

            const originalVideoPath = `./storage/${videoId}/original.${video.extension}`
            const targetVideoPath = `./storage/${videoId}/${width}x${height}.${video.extension}`

            try {
                await FF.resize(
                    originalVideoPath,
                    targetVideoPath,
                    width,
                    height,
                )

                db.update()
                const video = db.videos.find(vid => vid.videoId === videoId)
                video.resizes[`${width}x${height}`].processing = false
                db.save()

                console.log("Done resizing. Number of jobs remaing:", this.jobs.length)
            } catch (error) {

                util.deleteFile(targetVideoPath)
            }
        }

        this.currentJob = null
        this.executeNext()
    }

}

module.exports = JobQueue
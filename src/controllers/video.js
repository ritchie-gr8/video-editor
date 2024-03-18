const path = require("node:path")
const crypto = require("node:crypto")
const fs = require("node:fs/promises")
const { pipeline } = require("node:stream/promises")
const util = require("../../lib/util")
const db = require("../DB")

const getVideos = (req, res, handleErr) => {
    const name = req.params.get("name")
    if (name) {
        res.json({ message: `Your name is ${name}` })
    } else {
        return handleErr({ status: 400, message: "Please specify a name" })
    }
}

const uploadVideo = async (req, res, handleErr) => {

    const specifiedFileName = req.headers.filename
    const extension = path.extname(specifiedFileName).substring(1).toLowerCase()
    const name = path.parse(specifiedFileName).name
    const videoId = crypto.randomBytes(4).toString("hex")

    try {
        await fs.mkdir(`./storage/${videoId}`)
        const fullPath = `./storage/${videoId}/original.${extension}`
        const file = await fs.open(fullPath, 'w')
        const fileStream = file.createWriteStream()

        await pipeline(req, fileStream)

        db.update()
        db.videos.unshift({
            id: db.videos.length,
            videoId,
            name,
            extension,
            userId: req.userId,
            extractedAudio: false,
            resizes: {},
        })
        db.save()

        res.status(200).json({
            status: "success",
            message: "The file was uploaded successfully!"
        })

    } catch (error) {
        // delete the folder
        util.deleteFolder(`./storage/${videoId}`)
        if (error.code !== "ECONNRESET") return handleErr(error)
    }

}

const controller = {
    getVideos,
    uploadVideo
}

module.exports = controller
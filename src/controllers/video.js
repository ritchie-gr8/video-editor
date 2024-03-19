const path = require("node:path")
const crypto = require("node:crypto")
const fs = require("node:fs/promises")
const { pipeline } = require("node:stream/promises")
const util = require("../../lib/util")
const db = require("../DB")
const FF = require("../../lib/FF")

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

    const FORMATS_SUPPORTED = ["mov", "mp4"]
    if (FORMATS_SUPPORTED.indexOf(extension) == -1) {
        return handleErr({
            status: 400,
            message: "Only these formats are allowed: mov, mp4",
        })
    }

    try {
        await fs.mkdir(`./storage/${videoId}`)
        const fullPath = `./storage/${videoId}/original.${extension}`
        const file = await fs.open(fullPath, 'w')
        const fileStream = file.createWriteStream()
        const thumbnailPath = `./storage/${videoId}/thumbnail.jpg`

        await pipeline(req, fileStream)

        // make a thumbnail for the video file
        await FF.makeThumbnail(fullPath, thumbnailPath)

        // get the dimensions
        const dimensions = await FF.getDimensions(fullPath)

        db.update()
        db.videos.unshift({
            id: db.videos.length,
            videoId,
            name,
            extension,
            dimensions,
            userId: req.userId,
            extractedAudio: false,
            resizes: {},
        })
        db.save()

        res.status(201).json({
            status: "success",
            message: "The file was uploaded successfully!",
            thumbnailPath: thumbnailPath,
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
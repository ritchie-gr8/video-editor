const path = require("node:path")
const crypto = require("node:crypto")
const fs = require("node:fs/promises")
const { pipeline } = require("node:stream/promises")
const util = require("../../lib/util")
const db = require("../DB")
const FF = require("../../lib/FF")

const getVideos = (req, res, handleErr) => {
    db.update()
    const videos = db.videos.filter(video => {
        return video.userId === req.userId
    })

    res.status(200).json(videos)
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

// return video asset to the client
const getVideoAsset = async (req, res, handleErr) => {

    const videoId = req.params.get("videoId")
    const type = req.params.get("type")

    db.update()
    const video = db.videos.find(video => video.videoId === videoId)

    if (!video) {
        return handleErr({
            status: 404,
            message: "Video not found!"
        })
    }

    let file
    let mimeType
    let fileName // final file name for the download (including the extension)

    switch (type) {
        case "thumbnail":
            file = await fs.open(`./storage/${videoId}/thumbnail.jpg`, 'r')
            mimeType = 'image/jpeg'
            break
        case "audio":
            file = await fs.open(`./storage/${videoId}/audio.aac`, 'r')
            mimeType = 'audio/aac'
            fileName = `${video.name}-audio.aac`
            break
        case "resize":
            const dimensions = req.params.get("dimensions")
            file = await fs.open(`./storage/${videoId}/${dimensions}.${video.extension}`, 'r')
            mimeType = `video/${video.extension === 'mp4' ? 'mp4' : 'quicktime'}`
            fileName = `${video.name}-${dimensions}.${video.extension}`
            break
        case "original":
            file = await fs.open(`./storage/${videoId}/original.${video.extension}`, 'r')
            mimeType = `video/${video.extension === 'mp4' ? 'mp4' : 'quicktime'}`
            fileName = `${video.name}.${video.extension}`
            break
    }

    try {

        // grab the file size
        const stat = await file.stat()
        const fileStream = file.createReadStream()

        if (type !== 'thumbnail') {
            // set a header to prompt for download
            res.setHeader("Content-Disposition", `attachment; filename=${fileName}`)
        }

        // set the headers based on the file type
        res.setHeader("Content-Type", mimeType)
        res.setHeader("Content-Length", stat.size)

        res.status(200)

        await pipeline(fileStream, res)

        file.close()
    } catch (error) {
        console.log(error)
    }
}

const controller = {
    getVideos,
    uploadVideo,
    getVideoAsset
}

module.exports = controller
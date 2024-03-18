const fs = require("node:fs/promises")

const util = {}

// delete a file if exist, if not the function will not throw an error
util.deleteFile = async (path) => {
    try {
        await fs.unlink(path)
    } catch (error) {
        // do nothing
    }
}

// delete a folder if exist. if not the function will not throw an error
util.deleteFolder = async (path) => {
    try {
        await fs.rm(path, { recursive: true })
    } catch (error) {
        // do nothing
    }
}

module.exports = util
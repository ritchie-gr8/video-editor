const { spawn } = require("node:child_process");

const makeThumbnail = async (fullPath, thumbnailPath) => {
    // ffmpeg -i video.mp4 -ss 5 -vframes 1 thumbnail.jpg
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', fullPath,
            '-ss', '5',
            '-vframes', '1',
            thumbnailPath
        ]);

        ffmpeg.on('error', (err) => {
            reject(err);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve(thumbnailPath);
            } else {
                reject(new Error(`ffmpeg process exited with code ${code}`));
            }
        });
    });
}

// ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 video.mp4
const getDimensions = async (fullPath) => {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn("ffprobe", [
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height',
            '-of', 'csv=p=0',
            fullPath
        ]);

        let dimensions = '';
        ffprobe.stdout.on('data', (data) => {
            dimensions += data.toString('utf-8');
        });

        ffprobe.on('error', (err) => {
            reject(err);
        });

        ffprobe.on('close', (code) => {
            if (code === 0) {
                const [width, height] = dimensions.trim().split(',');
                resolve({
                    width: Number(width),
                    height: Number(height)
                });
            } else {
                reject(new Error(`ffprobe process exited with code ${code}`));
            }
        });
    });
};

// ffmpeg -i video.mp4 -vn -c:a copy audio.aac
const extractAudio = async (originalVideoPath, targetAudioPath) => {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
            "-i", originalVideoPath, "-vn",
            "-c:a", "copy", targetAudioPath
        ])

        ffmpeg.on("close", code => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`ffmpeg process exited with code ${code}`));
            }
        })

        ffmpeg.on("error", (err) => {
            reject(err)
        })
    })
}

// ffmpeg -i video.mp4 -vf scale=320:240 -c:a copy video-320-240.mp4
const resize = async (originalVideoPath, targetVideoPath, width, height) => {
    return new Promise((resolve, reject) => {

        const ffmpeg = spawn("ffmpeg", [
            "-i",
            originalVideoPath,
            "-vf",
            `scale=${width}:${height}`,
            "-c:a",
            "copy",
            "-threads",
            "2",
            "-y",
            targetVideoPath,
        ])


        ffmpeg.on("close", code => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`ffmpeg process exited with code ${code}`));
            }
        })

        ffmpeg.on("error", (err) => {
            reject(err)
        })

    })
}

module.exports = {
    makeThumbnail,
    getDimensions,
    extractAudio,
    resize
}
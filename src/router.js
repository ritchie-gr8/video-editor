// Controllers
const User = require("./controllers/user");
const Video = require("./controllers/video")

module.exports = (server) => {
  // ------------------------------------------------ //
  // ************ USER ROUTES ************* //
  // ------------------------------------------------ //

  // Log a user in and give them a token
  server.route("post", "/api/login", User.logUserIn);

  // Log a user out
  server.route("delete", "/api/logout", User.logUserOut);

  // Send user info
  server.route("get", "/api/user", User.sendUserInfo);

  // Update a user info
  server.route("put", "/api/user", User.updateUser);

  // ------------------------------------------------ //
  // ************ VIDEO ROUTES ************* //
  // ------------------------------------------------ //

  // return the list of all the videos that a logged in user has uploaded
  server.route("get", "/api/videos", Video.getVideos)

  // upload a video file
  server.route("post", "/api/upload-video", Video.uploadVideo)

  // extract audio from video file (can only be done once)
  server.route("patch", "/api/video/extract-audio", Video.extractAudio)

  // resize a video file (creates a new video file)
  server.route("put", "/api/video/resize", Video.resizeVideo)

  // return video asset to the client
  server.route("get", "/get-video-asset", Video.getVideoAsset)
};

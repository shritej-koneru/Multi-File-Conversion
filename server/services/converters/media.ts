/**
 * Media conversions: FFmpeg-based audio and video transcodes, including
 * the video -> GIF path (image -> GIF lives in the image module).
 */
import fs from "fs-extra";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { makeResult, isAudioFile, isVideoFile, type ConvertedFileInfo, type FileInfo } from "./shared";

/** Generic ffmpeg transcode with a builder hook. Returns the standard result. */
function runFfmpeg(
  inputPath: string,
  outputPath: string,
  file: FileInfo,
  build: (cmd: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand
): Promise<ConvertedFileInfo> {
  return new Promise((resolve, reject) => {
    build(ffmpeg(inputPath))
      .on("end", async () => {
        try {
          resolve(await makeResult(outputPath, file));
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => reject(new Error(`FFmpeg conversion failed: ${err.message}`)));
  });
}

// Audio conversions
async function convertToMp3(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (!isAudioFile(file.extension)) {
    throw new Error(`Cannot convert ${file.extension} to MP3`);
  }
  return runFfmpeg(inputPath, outputPath, file, (cmd) =>
    cmd.toFormat("mp3").audioBitrate(192).save(outputPath)
  );
}

async function convertToWav(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (!isAudioFile(file.extension)) {
    throw new Error(`Cannot convert ${file.extension} to WAV`);
  }
  return runFfmpeg(inputPath, outputPath, file, (cmd) => cmd.toFormat("wav").save(outputPath));
}

async function convertToOgg(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (!isAudioFile(file.extension)) {
    throw new Error(`Cannot convert ${file.extension} to OGG`);
  }
  return runFfmpeg(inputPath, outputPath, file, (cmd) => cmd.toFormat("ogg").save(outputPath));
}

async function convertToM4a(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (!isAudioFile(file.extension)) {
    throw new Error(`Cannot convert ${file.extension} to M4A`);
  }

  // NB: some ffmpeg builds (e.g. the common Windows gyan builds) have no
  // dedicated 'm4a' muxer; AAC audio in an mp4 container IS a valid m4a.
  return runFfmpeg(inputPath, outputPath, file, (cmd) =>
    cmd.toFormat("mp4").audioCodec("aac").save(outputPath)
  );
}

// Video conversions
async function convertToMp4(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (!isVideoFile(file.extension)) {
    throw new Error(`Cannot convert ${file.extension} to MP4`);
  }
  return runFfmpeg(inputPath, outputPath, file, (cmd) =>
    cmd.toFormat("mp4").videoCodec("libx264").audioCodec("aac").save(outputPath)
  );
}

async function convertToAvi(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (!isVideoFile(file.extension)) {
    throw new Error(`Cannot convert ${file.extension} to AVI`);
  }
  return runFfmpeg(inputPath, outputPath, file, (cmd) => cmd.toFormat("avi").save(outputPath));
}

async function convertToWebm(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (!isVideoFile(file.extension)) {
    throw new Error(`Cannot convert ${file.extension} to WebM`);
  }
  return runFfmpeg(inputPath, outputPath, file, (cmd) =>
    cmd.toFormat("webm").videoCodec("libvpx").audioCodec("libvorbis").save(outputPath)
  );
}

async function convertToMov(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (!isVideoFile(file.extension)) {
    throw new Error(`Cannot convert ${file.extension} to MOV`);
  }
  return runFfmpeg(inputPath, outputPath, file, (cmd) => cmd.toFormat("mov").save(outputPath));
}

/**
 * GIF conversion: handles video sources via FFmpeg and delegates image
 * sources to the image module.
 */
async function convertToGif(
  inputPath: string,
  outputPath: string,
  file: FileInfo,
  convertGifFromImage: (inputPath: string, outputPath: string, file: FileInfo) => Promise<ConvertedFileInfo>
): Promise<ConvertedFileInfo> {
  if (isVideoFile(file.extension)) {
    // Video to GIF conversion using FFmpeg (handle video first due to Promise return)
    console.log(`Converting video to GIF: ${inputPath} -> ${outputPath}`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(["-vf", "fps=10,scale=480:-1:flags=lanczos", "-loop", "0"])
        .toFormat("gif")
        .output(outputPath)
        .on("end", async () => {
          try {
            resolve(await makeResult(outputPath, file));
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (err) => {
          console.error(`❌ Video to GIF conversion failed:`, err);
          reject(new Error(`FFmpeg video to GIF conversion failed: ${err.message}`));
        })
        .run();
    });
  }

  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg", ".avif"].includes(file.extension.toLowerCase())) {
    // Image to GIF conversion using Sharp (in the image module)
    return convertGifFromImage(inputPath, outputPath, file);
  }

  throw new Error(`Cannot convert ${file.extension} to GIF. Supported: images and videos`);
}

export const mediaConversions = {
  mp3: convertToMp3,
  wav: convertToWav,
  ogg: convertToOgg,
  m4a: convertToM4a,
  mp4: convertToMp4,
  avi: convertToAvi,
  webm: convertToWebm,
  mov: convertToMov,
  gif: convertToGif,
};

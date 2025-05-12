const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Converte um vídeo ou GIF em WebP (figurinha) usando ffmpeg
 * @param {Buffer} buffer - Buffer do vídeo ou GIF
 * @param {string} ext - Extensão do arquivo original (ex: 'mp4', 'gif')
 * @returns {Promise<Buffer>} - Buffer do arquivo WebP
 */
function videoOuGifParaWebp(buffer, ext = 'mp4') {
  return new Promise((resolve, reject) => {
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `input_${Date.now()}.${ext}`);
    const outputPath = path.join(tmpDir, `output_${Date.now()}.webp`);
    fs.writeFileSync(inputPath, buffer);
    ffmpeg(inputPath)
      .inputFormat(ext)
      .outputOptions([
        '-vcodec', 'libwebp',
        '-vf', 'scale=320:320:force_original_aspect_ratio=decrease,fps=15',
        '-loop', '0',
        '-ss', '0',
        '-t', '5', // máximo 5 segundos
        '-preset', 'default',
        '-an',
        '-vsync', '0',
        '-s', '320:320',
        '-lossless', '1',
        '-compression_level', '6',
        '-q:v', '50'
      ])
      .on('end', () => {
        const webpBuffer = fs.readFileSync(outputPath);
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        resolve(webpBuffer);
      })
      .on('error', (err) => {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(err);
      })
      .save(outputPath);
  });
}

module.exports = { videoOuGifParaWebp };

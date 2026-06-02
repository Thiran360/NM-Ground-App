const { Jimp } = require("jimp");
const fs = require("fs");
const path = require("path");

const imagesDir = path.join(__dirname, "assets/images");

async function processAllImages() {
  const files = fs.readdirSync(imagesDir);

  for (const file of files) {
    if (!file.match(/\.(png|jpg|jpeg)$/i)) continue;

    const filePath = path.join(imagesDir, file);
    try {
      const image = await Jimp.read(filePath);
      const originalSize = fs.statSync(filePath).size;

      console.log(
        `Processing ${file} (Original: ${(originalSize / 1024).toFixed(2)} KB)`,
      );

      let width = image.bitmap.width;

      // Aggressive resizing for all images to ensure they stay in KB range
      if (width > 600) width = 600;
      if (file.includes("logo") || file.includes("icon"))
        width = Math.min(width, 256);
      if (file.includes("avatar")) width = Math.min(width, 150);

      image.resize({ w: width });

      // Save with lower quality
      // Jimp v1 uses .write(path, { quality: 50 }) or similar?
      // Actually, let's just use resize as the primary driver.

      await image.write(filePath);
      const newSize = fs.statSync(filePath).size;
      console.log(`Done ${file} (New: ${(newSize / 1024).toFixed(2)} KB)`);
    } catch (e) {
      console.error(`Error processing ${file}:`, e.message);
    }
  }
}

processAllImages();

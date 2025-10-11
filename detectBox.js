const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function detectBox(imagePath, targetColor = { r: 255, g: 0, b: 255 }) {
  console.log(`🔍 Tespit ediliyor: ${imagePath}`);
  
  const image = sharp(imagePath);
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width, minY = info.height;
  let maxX = 0, maxY = 0;
  let foundPixels = 0;

  const tolerance = 5;
  
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (
        Math.abs(r - targetColor.r) <= tolerance &&
        Math.abs(g - targetColor.g) <= tolerance &&
        Math.abs(b - targetColor.b) <= tolerance
      ) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        foundPixels++;
      }
    }
  }

  if (foundPixels === 0) {
    throw new Error(`❌ Magenta kutu bulunamadı! RGB(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`);
  }

  const params = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rotation: 0
  };

  console.log(`✅ Kutu tespit edildi! ${foundPixels} piksel bulundu.`);
  console.log(`   Pozisyon: X=${params.x}, Y=${params.y}`);
  console.log(`   Boyut: ${params.width}x${params.height}`);

  return params;
}

async function processTemplate(boxImagePath) {
  try {
    // Magenta kutuyu tespit et
    const params = await detectBox(boxImagePath, { r: 255, g: 0, b: 255 });
    
    // JSON dosya yolunu belirle (box.png → .json)
    const baseName = path.basename(boxImagePath, '-box.png');
    const outputJsonPath = path.join(
      path.dirname(boxImagePath),
      `${baseName}.json`
    );

    // JSON dosyasına kaydet
    await fs.writeFile(outputJsonPath, JSON.stringify(params, null, 2));
    console.log(`💾 JSON kaydedildi: ${outputJsonPath}\n`);

    return params;
  } catch (error) {
    console.error('❌ Hata:', error.message);
    throw error;
  }
}

// Komut satırından çalıştırma
const boxImagePath = process.argv[2];

if (!boxImagePath) {
  console.log('📖 Kullanım:');
  console.log('   node detectBox.js templates/tshirt-white-box.png');
  console.log('\n📁 Veya tüm box mockup\'ları işle:');
  console.log('   node detectBox.js templates/*-box.png');
  process.exit(1);
}

processTemplate(boxImagePath)
  .then(() => {
    console.log('✨ Tamamlandı!');
  })
  .catch((error) => {
    console.error('💥 İşlem başarısız:', error);
    process.exit(1);
  });
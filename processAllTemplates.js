const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function processAllBoxMockups() {
  const templatesDir = './templates';
  const files = fs.readdirSync(templatesDir);
  
  // Sadece -box.png ile bitenleri filtrele
  const boxFiles = files.filter(f => f.endsWith('-box.png'));
  
  console.log(`📦 ${boxFiles.length} adet box mockup bulundu.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const boxFile of boxFiles) {
    const boxPath = path.join(templatesDir, boxFile);
    const baseName = boxFile.replace('-box.png', '');
    
    console.log(`🔄 İşleniyor: ${boxFile}`);
    
    try {
      // detectBox.js'i çalıştır
      execSync(`node detectBox.js "${boxPath}"`, { 
        stdio: 'inherit' 
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Hata: ${boxFile} işlenemedi\n`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Başarılı: ${successCount}`);
  console.log(`❌ Başarısız: ${failCount}`);
  console.log(`📁 Toplam: ${boxFiles.length}`);
  console.log('='.repeat(50));
}

processAllBoxMockups();
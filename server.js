const express = require('express');
const multer = require('multer');
const cors = require('cors');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Auto Mockup API',
    version: '1.0.0',
    endpoints: {
      createMockup: 'POST /create-mockup'
    }
  });
});

app.post('/create-mockup', upload.fields([
  { name: 'design', maxCount: 1 },
  { name: 'mockup', maxCount: 1 }
]), async (req, res) => {
  let designPath, mockupPath;
  
  try {
    const designFile = req.files['design']?.[0];
    const mockupFile = req.files['mockup']?.[0];

    if (!designFile || !mockupFile) {
      return res.status(400).json({ 
        error: 'Both design and mockup files required'
      });
    }

    designPath = designFile.path;
    mockupPath = mockupFile.path;

    const params = {
      x: req.body.x ? parseInt(req.body.x) : null,
      y: req.body.y ? parseInt(req.body.y) : null,
      width: req.body.width ? parseInt(req.body.width) : null,
      height: req.body.height ? parseInt(req.body.height) : null,
      rotation: req.body.rotation ? parseFloat(req.body.rotation) : 0
    };

    const mockupImage = sharp(mockupPath);
    const designImage = sharp(designPath);

    const mockupMeta = await mockupImage.metadata();
    const designMeta = await designImage.metadata();

    const targetWidth = params.width || designMeta.width;
    const targetHeight = params.height || designMeta.height;
    const x = params.x !== null ? params.x : Math.floor((mockupMeta.width - targetWidth) / 2);
    const y = params.y !== null ? params.y : Math.floor((mockupMeta.height - targetHeight) / 2);

    let processedDesign = designImage.resize(targetWidth, targetHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });

    if (params.rotation !== 0) {
      processedDesign = processedDesign.rotate(params.rotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
    }

    const designBuffer = await processedDesign.toBuffer();

    const result = await mockupImage
      .composite([{
        input: designBuffer,
        left: x,
        top: y
      }])
      .png({ quality: 95 })
      .toBuffer();

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="mockup-${Date.now()}.png"`
    });
    res.send(result);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to create mockup',
      details: error.message 
    });
  } finally {
    if (designPath) await fs.unlink(designPath).catch(() => {});
    if (mockupPath) await fs.unlink(mockupPath).catch(() => {});
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Auto Mockup API running on port ${PORT}`);
});

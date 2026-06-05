// Generates a QR code for the public website as a PNG (for WhatsApp images /
// downloads) and as a branded one-page PDF (for WhatsApp documents / printing).
const QRCode = require('qrcode');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const GOLD = rgb(0.784, 0.659, 0.416); // matches the site primary (#c8a86a)

// Helvetica (WinAnsi) can't encode Arabic / emoji — strip anything outside the
// printable Latin-1 range so embedding text never throws.
const ascii = (s = '') => s.replace(/[^\x20-\x7E]/g, '').trim();

// PNG data URL + raw base64 (no prefix) for the given URL.
async function buildPng(url) {
  const dataUrl = await QRCode.toDataURL(url, { width: 600, margin: 2, errorCorrectionLevel: 'M' });
  return { dataUrl, base64: dataUrl.split(',')[1] };
}

// A4-ish portrait card: title, QR, caption, URL.
async function buildPdf(url, { title = 'Aura Net', caption = 'Scan to visit our website' } = {}) {
  const pngBuffer = await QRCode.toBuffer(url, { width: 600, margin: 2, errorCorrectionLevel: 'M', type: 'png' });

  const pdf      = await PDFDocument.create();
  const page     = pdf.addPage([420, 560]);
  const font     = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qr       = await pdf.embedPng(pngBuffer);
  const { width, height } = page.getSize();

  const centered = (text, y, size, f, color) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font: f, color });
  };

  const titleText = ascii(title) || 'Aura Net';
  centered(titleText, height - 70, 26, fontBold, GOLD);

  const qrSize = 300;
  page.drawImage(qr, { x: (width - qrSize) / 2, y: height - 120 - qrSize, width: qrSize, height: qrSize });

  centered(ascii(caption) || 'Scan to visit our website', height - 120 - qrSize - 36, 13, font, rgb(0.15, 0.15, 0.15));
  centered(ascii(url), height - 120 - qrSize - 58, 11, font, rgb(0.45, 0.45, 0.45));

  return Buffer.from(await pdf.save());
}

module.exports = { buildPng, buildPdf };

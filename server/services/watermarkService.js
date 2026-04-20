/**
 * watermarkService.js
 *
 * Burns a forensic watermark directly into image pixel data on the server
 * before the image is sent to the client.
 *
 * WHY SERVER-SIDE:
 *   - Canvas/CSS overlays are separate DOM layers — AI tools (Canva Magic Erase,
 *     Adobe Firefly, cleanup.pictures) can trivially strip them.
 *   - When the watermark is composited into the raw pixel buffer by sharp,
 *     it becomes indistinguishable from the original image data.
 *     There is no "layer" to remove — you would have to reconstruct
 *     missing pixels from scratch, which is detectable and traceable.
 *
 * FORENSIC PROPERTIES:
 *   - Wallet address uniquely identifies the viewer.
 *   - Timestamp pinpoints the exact access session.
 *   - Diagonal tiling means cropping cannot remove it.
 *   - Repeating pattern means a single inpaint leaves artifacts elsewhere.
 */

import sharp from "sharp";

const IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
]);

/**
 * Returns true if the MIME type is a raster image we can watermark.
 */
export function isWatermarkableImage(mimeType) {
    return IMAGE_MIME_TYPES.has(mimeType?.toLowerCase());
}

/**
 * Builds the SVG watermark tile as a Buffer.
 * The tile is tiled diagonally across the full image by sharp's `tile` composite.
 *
 * @param {string} viewerAddress  – Ethereum wallet address of the viewer
 * @param {string} accessTime     – ISO timestamp string of the access event
 * @param {number} tileW          – Width of one watermark tile (px)
 * @param {number} [opacity=0.28] – Text opacity (0–1). 0.28 = visible but unobtrusive.
 */
function buildWatermarkSvg(viewerAddress, accessTime, tileW, opacity = 0.28) {
    const shortAddr = viewerAddress
        ? `${viewerAddress.slice(0, 10)}...${viewerAddress.slice(-8)}`
        : "UNAUTHORISED";

    // Format time in a human-readable way
    const ts = new Date(accessTime).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day:    "2-digit",
        month:  "short",
        year:   "numeric",
        hour:   "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const fontSize  = Math.max(12, Math.round(tileW / 28));
    const lineGap   = Math.round(fontSize * 1.6);
    const tileH     = lineGap * 5;          // 3 text lines + padding
    const cx        = tileW / 2;
    const cy        = tileH / 2;
    const rot       = -35;                  // degrees

    // RGBA fill — semi-transparent indigo
    const fill = `rgba(79,70,229,${opacity})`;

    return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">
  <g transform="rotate(${rot} ${cx} ${cy})"
     font-family="'Inter','Arial',sans-serif"
     font-weight="700"
     font-size="${fontSize}"
     fill="${fill}"
     text-anchor="middle"
     dominant-baseline="middle">
    <text x="${cx}" y="${cy - lineGap}">⚕ CONFIDENTIAL – SANJEEVNI</text>
    <text x="${cx}" y="${cy}">${shortAddr}</text>
    <text x="${cx}" y="${cy + lineGap}">${ts}</text>
  </g>
</svg>`);
}

/**
 * Applies a tiled forensic watermark to an image buffer.
 *
 * @param {Buffer} imageBuffer   – Raw image bytes
 * @param {string} mimeType      – e.g. "image/jpeg"
 * @param {string} viewerAddress – Viewer's wallet address
 * @returns {Promise<Buffer>}    – Watermarked image bytes (always PNG output
 *                                 to avoid JPEG re-compression artefacts that
 *                                 can partially obscure the watermark text)
 */
export async function applyWatermark(imageBuffer, mimeType, viewerAddress) {
    const accessTime = new Date().toISOString();

    // Load image and get dimensions
    const image    = sharp(imageBuffer);
    const metadata = await image.metadata();
    const imgW     = metadata.width  || 800;
    const imgH     = metadata.height || 600;

    // Tile size: wide enough for the address, but not so large it's blocky
    const tileW = Math.min(Math.max(imgW / 2, 320), 600);
    const svgBuf = buildWatermarkSvg(viewerAddress, accessTime, tileW);

    // Build composite array: tile the watermark across the whole image
    const composites = [];
    const tileH = Math.round(tileW * 0.35); // approximate; sharp measures after render

    for (let y = -tileH; y < imgH + tileH; y += tileH) {
        for (let x = -tileW / 2; x < imgW + tileW; x += tileW) {
            composites.push({
                input:   svgBuf,
                top:     Math.round(y),
                left:    Math.round(x),
                blend:   "over",
            });
        }
    }

    // Composite and return as PNG (lossless, no compression artefacts)
    return image
        .composite(composites)
        .png({ quality: 90, compressionLevel: 6 })
        .toBuffer();
}

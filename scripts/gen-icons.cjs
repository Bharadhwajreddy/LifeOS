const sharp = require('sharp')
const path  = require('path')
const fs    = require('fs')

const OUT = path.join(__dirname, '..', 'public')
fs.mkdirSync(OUT, { recursive: true })

// Build SVG icon: deep navy bg, gradient ring, sparkle "L" monogram
function makeSvg(size) {
  const r = size / 2
  const pad = size * 0.12
  const inner = size - pad * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A2040"/>
      <stop offset="100%" stop-color="#0D1020"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7C6BFF"/>
      <stop offset="50%" stop-color="#3B9EFF"/>
      <stop offset="100%" stop-color="#0EC9A8"/>
    </linearGradient>
    <linearGradient id="letter" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#C0D0FF"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${size * 0.03}" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}" fill="url(#bg)"/>

  <!-- Subtle inner glow -->
  <radialGradient id="innerGlow" cx="0.35" cy="0.3" r="0.6">
    <stop offset="0%" stop-color="#5060CC" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
  </radialGradient>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}" fill="url(#innerGlow)"/>

  <!-- Gradient ring arc -->
  <circle cx="${r}" cy="${r}" r="${r * 0.7}" fill="none" stroke="url(#ring)" stroke-width="${size * 0.05}" stroke-linecap="round" stroke-dasharray="${Math.PI * r * 1.4 * 0.82} ${Math.PI * r * 1.4 * 0.18}" stroke-dashoffset="${Math.PI * r * 1.4 * 0.05}" opacity="0.9"/>

  <!-- "L" letter (bold, centered) -->
  <text
    x="${r}"
    y="${r + size * 0.13}"
    text-anchor="middle"
    font-family="'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
    font-weight="900"
    font-size="${size * 0.38}"
    fill="url(#letter)"
    filter="url(#glow)"
  >L</text>

  <!-- Small sparkle dots -->
  <circle cx="${r + r * 0.52}" cy="${r - r * 0.48}" r="${size * 0.028}" fill="#7C6BFF" opacity="0.9"/>
  <circle cx="${r - r * 0.55}" cy="${r - r * 0.42}" r="${size * 0.018}" fill="#3B9EFF" opacity="0.7"/>
  <circle cx="${r + r * 0.48}" cy="${r + r * 0.52}" r="${size * 0.015}" fill="#0EC9A8" opacity="0.7"/>
</svg>`
}

async function gen(size, filename) {
  const svg = Buffer.from(makeSvg(size))
  await sharp(svg).resize(size, size).png().toFile(path.join(OUT, filename))
  console.log(`✓ ${filename}`)
}

;(async () => {
  await gen(512, 'icon-512.png')
  await gen(192, 'icon-192.png')
  await gen(180, 'apple-touch-icon.png')
  console.log('All icons generated.')
})()

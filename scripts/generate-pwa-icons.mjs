import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const iconsDir = join(publicDir, 'icons')
const designDir = join(__dirname, '..', 'design')
const secretsDir = join(__dirname, '..', '..', 'GliderPilotLogbookCore', 'secrets')

const sourceCandidates = [
  process.argv[2],
  join(designDir, 'icon.svg'),
  join(secretsDir, 'icon.png'),
  join(__dirname, '..', 'secrets', 'icon.png'),
  join(designDir, 'icon-master.png'),
].filter(Boolean)

const sourcePath = sourceCandidates.find((path) => existsSync(path))
if (!sourcePath) {
  throw new Error('Icon source not found. Add design/icon.svg or secrets/icon.png.')
}

mkdirSync(iconsDir, { recursive: true })
mkdirSync(designDir, { recursive: true })

function removeEdgeWhiteBackground({ data, width, height, channels }, threshold = 248) {
  const out = Buffer.from(data)
  const visited = new Uint8Array(width * height)
  const queue = []

  const isBackgroundWhite = (x, y) => {
    const i = (y * width + x) * channels
    const r = out[i]
    const g = out[i + 1]
    const b = out[i + 2]
    return r >= threshold && g >= threshold && b >= threshold
  }

  const pushIfWhite = (x, y) => {
    const idx = y * width + x
    if (visited[idx] || !isBackgroundWhite(x, y)) return
    visited[idx] = 1
    queue.push([x, y])
  }

  for (let x = 0; x < width; x++) {
    pushIfWhite(x, 0)
    pushIfWhite(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    pushIfWhite(0, y)
    pushIfWhite(width - 1, y)
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop()
    const i = (y * width + x) * channels
    out[i + 3] = 0
    if (x > 0) pushIfWhite(x - 1, y)
    if (x < width - 1) pushIfWhite(x + 1, y)
    if (y > 0) pushIfWhite(x, y - 1)
    if (y < height - 1) pushIfWhite(x, y + 1)
  }

  return out
}

async function loadIconWithTransparency(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const processed = removeEdgeWhiteBackground({
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  })
  return sharp(processed, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .png()
    .toBuffer()
}

async function loadIconSource(path) {
  if (path.endsWith('.svg')) {
    return sharp(path, { density: 384 })
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()
  }
  return loadIconWithTransparency(path)
}

const source = await loadIconSource(sourcePath)
const trimmed = await sharp(source).trim().png().toBuffer()
const squared = await sharp(trimmed)
  .resize(512, 512, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer()

const maskable = await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 0, g: 33, b: 71, alpha: 1 },
  },
})
  .composite([
    {
      input: await sharp(squared).resize(384, 384, { fit: 'contain' }).png().toBuffer(),
      gravity: 'center',
    },
  ])
  .png()
  .toBuffer()

console.log(`source ${sourcePath}`)

async function writeSized(name, size, dir, input = squared) {
  const outPath = join(dir, name)
  const buffer = await sharp(input).resize(size, size, { kernel: sharp.kernel.lanczos3 }).png().toBuffer()
  writeFileSync(outPath, buffer)
  console.log(`wrote ${outPath} (${size}x${size})`)
}

await writeSized('icon-512x512.png', 512, iconsDir)
await writeSized('icon-512-maskable.png', 512, iconsDir, maskable)
await writeSized('icon-192x192.png', 192, iconsDir)
await writeSized('email-logo.png', 128, iconsDir)
await writeSized('apple-touch-icon.png', 180, publicDir)
await writeSized('favicon-32x32.png', 32, publicDir)
await writeSized('favicon-16x16.png', 16, publicDir)

writeFileSync(join(designDir, 'icon-transparent.png'), squared)
console.log(`wrote ${join(designDir, 'icon-transparent.png')}`)

const png16 = readFileSync(join(publicDir, 'favicon-16x16.png'))
const png32 = readFileSync(join(publicDir, 'favicon-32x32.png'))
writeFileSync(join(publicDir, 'favicon.ico'), encodeIco([{ size: 16, data: png16 }, { size: 32, data: png32 }]))
console.log(`wrote ${join(publicDir, 'favicon.ico')}`)

function encodeIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  const entries = []
  let offset = 6 + images.length * 16
  for (const image of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(image.size === 256 ? 0 : image.size, 0)
    entry.writeUInt8(image.size === 256 ? 0 : image.size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(image.data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += image.data.length
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)])
}

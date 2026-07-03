// Image helpers for 圖片描述模組。
// Claude vision needs base64 raster data, so everything converges on a JPEG/PNG data URL:
// - Picsum photos: fetch (CORS ok) → blob → data URL
// - Local SVG charts: draw onto canvas → PNG data URL
// - User uploads: FileReader → data URL

// 20 種情境（校園、廚房、街景…）— loremflickr 依關鍵字給真實照片。
// picsum.photos 在使用者的網路連不上（實測 timeout），所以 loremflickr 為主、picsum 為備援。
const SCENES = [
  'campus', 'kitchen', 'street', 'cafe', 'park', 'market', 'library', 'train',
  'dog', 'cat', 'beach', 'city', 'melbourne', 'food', 'classroom',
  'supermarket', 'bicycle', 'garden', 'airport', 'concert',
]

export function randomPhotoUrl() {
  const scene = SCENES[Math.floor(Math.random() * SCENES.length)]
  const lock = Math.floor(Math.random() * 100000)
  return `https://loremflickr.com/800/600/${scene}?lock=${lock}`
}

export function fallbackPhotoUrl() {
  const seed = Math.random().toString(36).slice(2, 10)
  return `https://picsum.photos/seed/${seed}/800/600`
}

export const CHARTS = [
  { file: 'chart-bar.svg', label: '長條圖：圖書館使用量' },
  { file: 'chart-line.svg', label: '折線圖：學生睡眠時數' },
  { file: 'chart-pie.svg', label: '圓餅圖：通勤方式' },
  { file: 'chart-flow.svg', label: '流程圖：交作業流程' },
]

export function chartUrl(file) {
  return import.meta.env.BASE_URL + 'images/' + file
}

export async function urlToDataUrl(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('image fetch failed: ' + res.status)
  const blob = await res.blob()
  if (blob.type === 'image/svg+xml') return svgBlobToPng(blob)
  return blobToDataUrl(blob)
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

// Claude vision doesn't accept SVG — rasterize to PNG via canvas.
function svgBlobToPng(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width || 800
      canvas.height = img.height || 600
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

// Downscale big phone photos before sending to the API (keeps requests fast/cheap).
export function downscaleDataUrl(dataUrl, maxDim = 1024) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      if (scale >= 1) return resolve(dataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

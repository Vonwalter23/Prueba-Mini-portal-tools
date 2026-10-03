import { useEffect, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import type { ToolDefinition } from '../../engine/types'
import {
  calculateResizeDimensions,
  calculateScaleDimensions,
  calculateSizeChange,
  extensionForMime,
  formatBytes,
  formatLabel,
  IMAGE_LIMITS,
  processImage,
  validateImageFile,
  type ImageFormat,
  type ProcessedImage,
} from './shared/image-processing'
import { normalizeCompressionQuality } from './image-compressor'
import { parsePositiveDimension } from './image-resizer'
import { jpegNeedsBackground } from './image-converter'

interface Props { tool: ToolDefinition }
type ToolId = 'image-compressor' | 'image-resizer' | 'image-converter'
const formatOptions: { value: ImageFormat; label: string }[] = [
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
]

export default function ImageToolPage({ tool }: Props) {
  const id = tool.id as ToolId
  const fileInput = useRef<HTMLInputElement>(null)
  const selectionRequest = useRef(0)
  const processingRequest = useRef(0)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [result, setResult] = useState<ProcessedImage | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [format, setFormat] = useState<ImageFormat>('image/webp')
  const [quality, setQuality] = useState(0.82)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lockRatio, setLockRatio] = useState(true)
  const [scale, setScale] = useState('')
  const [background, setBackground] = useState('#ffffff')
  const [sourceDimensions, setSourceDimensions] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
  }, [previewUrl, resultUrl])

  function clearResult() {
    setResultUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return ''
    })
    setResult(null)
    setError('')
    setStatus('')
  }

  async function acceptFile(nextFile?: File) {
    if (!nextFile) return
    const requestId = ++selectionRequest.current
    processingRequest.current += 1
    setBusy(false)
    clearResult()
    setError('')
    setFile(null)
    setSourceDimensions(null)
    setPreviewUrl('')
    try {
      const inputFormat = validateImageFile(nextFile)
      const url = URL.createObjectURL(nextFile)
      let bitmap: ImageBitmap
      try {
        bitmap = await createImageBitmap(nextFile)
      } catch {
        URL.revokeObjectURL(url)
        throw new Error('No se pudo abrir la imagen. Verificá que el archivo no esté dañado.')
      }
      try {
        if (requestId !== selectionRequest.current) {
          URL.revokeObjectURL(url)
          return
        }
        if (!bitmap.width || !bitmap.height) throw new Error('La imagen no tiene dimensiones válidas.')
        if (bitmap.width * bitmap.height > IMAGE_LIMITS.maxPixels) {
          throw new Error('La imagen supera el límite de 40 megapíxeles.')
        }
        setSourceDimensions({ width: bitmap.width, height: bitmap.height })
        setWidth(String(bitmap.width))
        setHeight(String(bitmap.height))
        setScale('')
        setFormat(id === 'image-compressor' ? 'image/webp' : id === 'image-converter' ? (inputFormat === 'image/webp' ? 'image/jpeg' : 'image/webp') : inputFormat)
        setFile(nextFile)
        setPreviewUrl(url)
      } catch (cause) {
        URL.revokeObjectURL(url)
        throw cause
      } finally {
        bitmap.close()
      }
    } catch (cause) {
      if (requestId === selectionRequest.current) {
        setError(cause instanceof Error ? cause.message : 'No se pudo abrir el archivo.')
      }
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    void acceptFile(event.target.files?.[0])
    event.target.value = ''
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    void acceptFile(event.dataTransfer.files[0])
  }

  async function run() {
    if (!file || !sourceDimensions) {
      setError('Seleccioná una imagen antes de continuar.')
      return
    }
    const requestId = ++processingRequest.current
    const inputFile = file
    const inputDimensions = sourceDimensions
    setBusy(true)
    setError('')
    setStatus('')
    clearResult()
    try {
      let outputWidth = inputDimensions.width
      let outputHeight = inputDimensions.height
      const outputFormat = format
      let outputQuality = quality
      if (id === 'image-resizer') {
        if (scale.trim()) {
          const dimensions = calculateScaleDimensions(inputDimensions.width, inputDimensions.height, Number(scale))
          outputWidth = dimensions.width
          outputHeight = dimensions.height
        } else {
          const requestedWidth = parsePositiveDimension(width, 'ancho')
          const requestedHeight = parsePositiveDimension(height, 'alto')
          const dimensions = calculateResizeDimensions(inputDimensions.width, inputDimensions.height, requestedWidth, requestedHeight, lockRatio)
          outputWidth = dimensions.width
          outputHeight = dimensions.height
        }
      }
      if (id === 'image-converter') outputQuality = 0.92
      if (outputFormat === 'image/png') outputQuality = 1
      const processed = await processImage(inputFile, {
        format: outputFormat,
        quality: normalizeCompressionQuality(outputQuality),
        width: outputWidth,
        height: outputHeight,
        background,
      })
      if (requestId !== processingRequest.current) return
      const url = URL.createObjectURL(processed.blob)
      setResult(processed)
      setResultUrl(url)
      setStatus('Imagen procesada correctamente. El archivo se generó en este navegador.')
    } catch (cause) {
      if (requestId === processingRequest.current) {
        setError(cause instanceof Error ? cause.message : 'No se pudo procesar la imagen.')
      }
    } finally {
      if (requestId === processingRequest.current) setBusy(false)
    }
  }

  function reset() {
    selectionRequest.current += 1
    processingRequest.current += 1
    setBusy(false)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    clearResult()
    setFile(null)
    setPreviewUrl('')
    setSourceDimensions(null)
    setWidth('')
    setHeight('')
    setScale('')
    setError('')
    setStatus('')
    if (fileInput.current) fileInput.current.value = ''
  }

  const sizeChange = file && result ? calculateSizeChange(file.size, result.blob.size) : null
  const isResizer = id === 'image-resizer'
  const isCompressor = id === 'image-compressor'
  const jpegOutput = jpegNeedsBackground(format)

  return (
    <>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <main id="main-content" className="page-shell tool-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Microportal Tools, inicio">
          <span className="brand-mark">M</span><span>microportal<span className="brand-light">.tools</span></span>
        </a>
        <span className="topbar-note">Procesamiento local · Privacidad primero</span>
      </header>
      <nav className="breadcrumbs" aria-label="Migas de pan">
        <a href="/">Inicio</a><span aria-hidden="true">/</span><span>{tool.name}</span>
      </nav>
      <section className="tool-intro">
        <span className="eyebrow">HERRAMIENTA GRATUITA</span>
        <h1>{tool.name}</h1>
        <p>{tool.description}</p>
        <p className="local-note">✓ La imagen se procesa en este navegador y no se sube a un servidor para su procesamiento.</p>
      </section>
      <section className="tool-workspace image-workspace" aria-label={tool.name}>
        <div
          className="image-dropzone"
          role="button"
          tabIndex={0}
          aria-label="Seleccionar imagen"
          onClick={() => fileInput.current?.click()}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.current?.click() } }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <strong>{file ? file.name : 'Elegí o arrastrá una imagen'}</strong>
          <span>JPEG, PNG o WebP · Máximo 20 MiB y 40 megapíxeles</span>
          <span className="secondary-button">Seleccionar archivo</span>
        </div>
        <input ref={fileInput} className="visually-hidden" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-label="Archivo de imagen" onChange={onFileChange} />
        {file && sourceDimensions && (
          <div className="image-preview-grid">
            <div>
              <h2>Imagen original</h2>
              <img src={previewUrl} alt={`Vista previa de ${file.name}`} className="image-preview" />
              <p className="image-meta">{sourceDimensions.width} × {sourceDimensions.height} px · {formatBytes(file.size)}</p>
            </div>
            <div className="image-options">
              {isCompressor && <p className="option-help">Reducí el peso ajustando formato y calidad. La compresión puede producir un archivo más grande según la imagen original.</p>}
              {isResizer && (
                <>
                  <div className="form-grid">
                    <label className="field-label" htmlFor="image-width">Ancho (px)
                      <input id="image-width" type="number" min="1" max="40000" value={width} onChange={(event) => { setWidth(event.target.value); setScale('') }} />
                    </label>
                    <label className="field-label" htmlFor="image-height">Alto (px)
                      <input id="image-height" type="number" min="1" max="40000" value={height} onChange={(event) => { setHeight(event.target.value); setScale('') }} />
                    </label>
                  </div>
                  <label className="checkbox-label"><input type="checkbox" checked={lockRatio} onChange={(event) => setLockRatio(event.target.checked)} /> Mantener proporción (encajar dentro de las dimensiones indicadas)</label>
                  <label className="field-label" htmlFor="image-scale">Escala porcentual opcional (1–800 %)
                    <input id="image-scale" type="number" min="1" max="800" value={scale} onChange={(event) => setScale(event.target.value)} />
                  </label>
                  <p className="option-help">Completá el porcentaje para escalar respecto del original; dejalo vacío para usar ancho y alto.</p>
                </>
              )}
              <label className="field-label" htmlFor="image-format">Formato de salida
                <select id="image-format" value={format} onChange={(event) => setFormat(event.target.value as ImageFormat)}>
                  {formatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              {isCompressor && format !== 'image/png' && (
                <label className="field-label" htmlFor="image-quality">Calidad: {Math.round(quality * 100)} %
                  <input id="image-quality" type="range" min="10" max="100" value={Math.round(quality * 100)} onChange={(event) => setQuality(Number(event.target.value) / 100)} />
                </label>
              )}
              {jpegOutput && (
                <div className="jpeg-background-note">
                  <p>JPEG no admite transparencia: las zonas transparentes se rellenan con este fondo.</p>
                  <label className="field-label" htmlFor="jpeg-background">Fondo JPEG
                    <input id="jpeg-background" type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
                  </label>
                </div>
              )}
              <button className="primary-button" type="button" onClick={() => void run()} disabled={busy}>{busy ? 'Procesando…' : isCompressor ? 'Comprimir imagen' : isResizer ? 'Redimensionar imagen' : 'Convertir imagen'}</button>
            </div>
          </div>
        )}
        {result && resultUrl && file && (
          <section className="image-result" aria-label="Resultado del procesamiento">
            <h2>Resultado</h2>
            <img src={resultUrl} alt={`Vista previa del resultado en formato ${formatLabel(result.format)}`} className="image-preview" />
            <p className="image-meta">{result.width} × {result.height} px · {formatLabel(result.format)} · {formatBytes(result.blob.size)}</p>
            <p className="image-meta">{sizeChange && (sizeChange.reduced
              ? `Reducción del ${sizeChange.percentage.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`
              : sizeChange.percentage < 0
                ? `El archivo aumentó ${Math.abs(sizeChange.percentage).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`
                : 'El tamaño del archivo no cambió.')}</p>
            <div className="button-row">
              <a className="primary-link" href={resultUrl} download={`${file.name.replace(/\.[^.]+$/u, '')}-microportal.${extensionForMime(result.format)}`}>Descargar imagen</a>
              <button className="secondary-button" type="button" onClick={reset}>Procesar otra imagen</button>
            </div>
          </section>
        )}
        {error && <p className="feedback error" role="alert">{error}</p>}
        {status && <p className="feedback success" role="status">{status}</p>}
      </section>
      <section className="how-to">
        <h2>Cómo usar esta herramienta</h2>
        <p>{isCompressor
          ? 'Seleccioná una imagen, elegí el formato y ajustá la calidad si corresponde. Compará el tamaño original con el resultado antes de descargarlo.'
          : isResizer
            ? 'Seleccioná una imagen y definí las dimensiones o el porcentaje de escala. La opción de proporción mantiene la relación de aspecto y encaja la imagen dentro de las dimensiones elegidas.'
            : 'Seleccioná una imagen y el formato de destino. Si elegís JPEG, seleccioná el color de fondo para reemplazar las áreas transparentes.'}</p>
        <p>Se acepta una imagen por vez. No se admiten SVG, GIF animados, HEIC/HEIF ni archivos de más de 20 MiB o 40 megapíxeles.</p>
        <h2>Herramientas relacionadas</h2>
        <ul className="related-tools">
          {id !== 'image-compressor' && <li><a href="/herramientas/comprimir-imagen">Compresor de imágenes</a></li>}
          {id !== 'image-resizer' && <li><a href="/herramientas/redimensionar-imagen">Redimensionador de imágenes</a></li>}
          {id !== 'image-converter' && <li><a href="/herramientas/convertir-imagen">Conversor de imágenes</a></li>}
        </ul>
      </section>
      <footer className="footer"><span>© {new Date().getFullYear()} Microportal Tools</span><a href="/">Volver al inicio</a></footer>
      </main>
    </>
  )
}

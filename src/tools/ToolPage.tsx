import { useState, type AnchorHTMLAttributes } from 'react'
import type { ToolDefinition } from '../engine/types'
import { formatJson } from './json-formatter'
import { countText } from './word-counter'
import { calculatePercentage, type CalculatorMode } from './percentage-discount'
import { cleanText } from './text-cleaner'
import { decodeBase64, encodeBase64 } from './base64'
import ImageToolPage from './image/ImageToolPage'

interface ToolPageProps {
  tool: ToolDefinition
}

const cleanDefaults = {
  trimLines: true,
  removeBlankLines: false,
  collapseSpaces: true,
  removeDuplicateLines: false,
}

function CoreToolPage({ tool }: ToolPageProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [jsonMode, setJsonMode] = useState<'pretty' | 'minify'>('pretty')
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('percentage')
  const [firstNumber, setFirstNumber] = useState('200')
  const [secondNumber, setSecondNumber] = useState('15')
  const [cleanOptions, setCleanOptions] = useState(cleanDefaults)
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode')

  const counts = tool.id === 'word-counter' ? countText(input) : null

  function runTool() {
    setError('')
    setStatus('')
    try {
      if (tool.id === 'json-formatter') {
        setOutput(formatJson(input, jsonMode))
      } else if (tool.id === 'percentage-discount') {
        if (firstNumber.trim() === '' || secondNumber.trim() === '') {
          throw new Error('Completá ambos campos numéricos.')
        }
        const result = calculatePercentage(calculatorMode, Number(firstNumber), Number(secondNumber))
        setOutput(calculatorMode === 'percentage'
          ? result.primary.toLocaleString('es-AR', { maximumFractionDigits: 8 })
          : calculatorMode === 'discount'
            ? `Precio final: ${result.primary.toLocaleString('es-AR', { maximumFractionDigits: 8 })}\nDescuento: ${result.secondary.toLocaleString('es-AR', { maximumFractionDigits: 8 })}`
            : `Variación: ${result.primary.toLocaleString('es-AR', { maximumFractionDigits: 8 })}%\nDiferencia: ${result.secondary.toLocaleString('es-AR', { maximumFractionDigits: 8 })}`)
      } else if (tool.id === 'text-cleaner') {
        setOutput(cleanText(input, cleanOptions))
      } else if (tool.id === 'base64') {
        setOutput(base64Mode === 'encode' ? encodeBase64(input) : decodeBase64(input))
      }
    } catch (cause) {
      setOutput('')
      setError(cause instanceof Error ? cause.message : 'No se pudo procesar la entrada.')
    }
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output)
      setStatus('Resultado copiado.')
    } catch {
      setError('No se pudo copiar automáticamente. Seleccioná el resultado y copialo manualmente.')
    }
  }

  function resetTool() {
    setInput('')
    setOutput('')
    setError('')
    setStatus('')
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <main id="main-content" className="page-shell tool-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Microportal Tools, inicio">
          <span className="brand-mark">M</span>
          <span>microportal<span className="brand-light">.tools</span></span>
        </Link>
        <span className="topbar-note">Procesamiento local · Privacidad primero</span>
      </header>

      <nav className="breadcrumbs" aria-label="Migas de pan">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span><span>{tool.name}</span>
      </nav>

      <section className="tool-intro">
        <span className="eyebrow">HERRAMIENTA GRATUITA</span>
        <h1>{tool.name}</h1>
        <p>{tool.description}</p>
        <p className="local-note">✓ Tus datos se procesan en este navegador; no se envían a un servidor.</p>
      </section>

      <section className="tool-workspace" aria-label={tool.name}>
        {tool.id === 'percentage-discount' ? (
          <div className="form-grid">
            <label className="field-label" htmlFor="calculator-mode">Qué querés calcular
              <select id="calculator-mode" value={calculatorMode} onChange={(event) => { setCalculatorMode(event.target.value as CalculatorMode); setOutput(''); setError('') }}>
                <option value="percentage">Porcentaje de un valor</option>
                <option value="discount">Precio con descuento</option>
                <option value="change">Variación porcentual entre dos valores</option>
              </select>
            </label>
            <label className="field-label" htmlFor="first-number">{calculatorMode === 'change' ? 'Valor inicial' : 'Valor ($ o número)'}
              <input id="first-number" inputMode="decimal" type="number" value={firstNumber} onChange={(event) => setFirstNumber(event.target.value)} />
            </label>
            <label className="field-label" htmlFor="second-number">{calculatorMode === 'change' ? 'Valor final' : 'Porcentaje (%)'}
              <input id="second-number" inputMode="decimal" type="number" value={secondNumber} onChange={(event) => setSecondNumber(event.target.value)} />
            </label>
            <button className="primary-button" type="button" onClick={runTool}>Calcular</button>
          </div>
        ) : (
          <>
            {tool.id === 'json-formatter' && (
              <label className="field-label" htmlFor="json-mode">Formato de salida
                <select id="json-mode" value={jsonMode} onChange={(event) => setJsonMode(event.target.value as 'pretty' | 'minify')}>
                  <option value="pretty">Legible (indentado)</option>
                  <option value="minify">Compacto (minificado)</option>
                </select>
              </label>
            )}
            {tool.id === 'base64' && (
              <label className="field-label" htmlFor="base64-mode">Operación
                <select id="base64-mode" value={base64Mode} onChange={(event) => setBase64Mode(event.target.value as 'encode' | 'decode')}>
                  <option value="encode">Codificar texto a Base64</option>
                  <option value="decode">Decodificar Base64 a texto</option>
                </select>
              </label>
            )}
            {tool.id === 'text-cleaner' && (
              <fieldset className="options-fieldset">
                <legend>Transformaciones (elegí las que necesitás)</legend>
                {([
                  ['trimLines', 'Quitar espacios al inicio y al final de cada línea'],
                  ['collapseSpaces', 'Reducir espacios y tabulaciones consecutivos'],
                  ['removeBlankLines', 'Eliminar líneas vacías'],
                  ['removeDuplicateLines', 'Eliminar líneas duplicadas (conservar la primera)'],
                ] as const).map(([key, label]) => (
                  <label className="checkbox-label" key={key}>
                    <input type="checkbox" checked={cleanOptions[key]} onChange={(event) => setCleanOptions((previous) => ({ ...previous, [key]: event.target.checked }))} />
                    {label}
                  </label>
                ))}
              </fieldset>
            )}
            <label className="field-label" htmlFor="tool-input">Entrada
              <textarea id="tool-input" value={input} onChange={(event) => { setInput(event.target.value); if (tool.id !== 'word-counter') { setOutput(''); setError(''); setStatus('') } }} rows={9} placeholder={tool.id === 'json-formatter' ? '{"nombre":"Ejemplo","activo":true}' : tool.id === 'base64' && base64Mode === 'decode' ? 'SG9sYSwgVHJlbGV3IQ==' : 'Escribí o pegá tu texto acá…'} />
            </label>
            {counts && (
              <div className="count-grid" aria-live="polite" aria-label="Estadísticas del texto">
                <div><strong>{counts.words}</strong><span>Palabras</span></div>
                <div><strong>{counts.characters}</strong><span>Caracteres</span></div>
                <div><strong>{counts.charactersWithoutWhitespace}</strong><span>Sin espacios en blanco</span></div>
                <div><strong>{counts.readingMinutes} min</strong><span>Lectura estimada</span></div>
              </div>
            )}
            <div className="button-row">
              <button className="primary-button" type="button" onClick={runTool}>{tool.id === 'base64' ? (base64Mode === 'encode' ? 'Codificar' : 'Decodificar') : tool.id === 'text-cleaner' ? 'Limpiar texto' : 'Procesar JSON'}</button>
              <button className="secondary-button" type="button" onClick={resetTool}>Limpiar campos</button>
            </div>
          </>
        )}

        {tool.id !== 'word-counter' && (
          <div className="result-section">
            <label className="field-label" htmlFor="tool-output">Resultado
              <textarea id="tool-output" value={output} readOnly rows={7} placeholder="El resultado aparecerá acá." />
            </label>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={copyOutput} disabled={!output}>Copiar resultado</button>
              {tool.id === 'percentage-discount' && <button className="secondary-button" type="button" onClick={resetTool}>Restablecer</button>}
            </div>
          </div>
        )}
        {error && <p className="feedback error" role="alert">{error}</p>}
        {status && <p className="feedback success" role="status">{status}</p>}
      </section>

      {tool.id === 'base64' && <p className="disclaimer">Importante: Base64 es una codificación, no un método de cifrado ni una forma de proteger información.</p>}

      <section className="how-to">
        <h2>Cómo usar esta herramienta</h2>
        <p>{tool.id === 'json-formatter' ? 'Pegá un JSON válido, elegí si querés una salida legible o compacta y presioná Procesar JSON. El contenido se analiza como datos, nunca se ejecuta como código.' : tool.id === 'word-counter' ? 'Escribí o pegá el texto. Los conteos se actualizan mientras escribís. Las palabras se cuentan como secuencias de letras o números; los apóstrofos internos se admiten.' : tool.id === 'percentage-discount' ? 'Elegí el cálculo, ingresá ambos valores y presioná Calcular. La variación porcentual usa el valor inicial como base.' : tool.id === 'text-cleaner' ? 'Pegá el texto y seleccioná explícitamente las transformaciones. Si quitás duplicados, se conserva la primera aparición y el orden original.' : 'Elegí codificar o decodificar y procesá el texto. Se usa UTF-8 para admitir acentos y emoji. Base64 no cifra los datos.'}</p>
        <h2>Herramientas relacionadas</h2>
        <ul className="related-tools">
          {tool.id !== 'json-formatter' && <li><Link href="/herramientas/json-formatter">Formateador JSON</Link></li>}
          {tool.id !== 'word-counter' && <li><Link href="/herramientas/contador-palabras-caracteres">Contador de palabras</Link></li>}
          {tool.id !== 'percentage-discount' && <li><Link href="/herramientas/calculadora-porcentajes-descuentos">Calculadora de porcentajes</Link></li>}
          {tool.id !== 'text-cleaner' && <li><Link href="/herramientas/limpiador-de-texto">Limpiador de texto</Link></li>}
          {tool.id !== 'base64' && <li><Link href="/herramientas/codificador-decodificador-base64">Base64</Link></li>}
        </ul>
      </section>

      <footer className="footer"><span>© {new Date().getFullYear()} Microportal Tools</span><Link href="/">Volver al inicio</Link></footer>
      </main>
    </>
  )
}

export function Link({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const basePath = import.meta.env.BASE_URL
  const resolvedHref = href?.startsWith('/') && !href.startsWith('//')
    ? `${basePath.replace(/\/$/u, '')}${href}` || '/'
    : href
  return <a {...props} href={resolvedHref} />
}

export default function ToolPage({ tool }: ToolPageProps) {
  if (tool.category === 'images') return <ImageToolPage tool={tool} />
  return <CoreToolPage tool={tool} />
}

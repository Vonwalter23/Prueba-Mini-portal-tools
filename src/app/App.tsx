import { useEffect } from 'react'
import {
  Calculator,
  Code2,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { getToolsByCategory, toolRegistry } from '../engine/registry'
import { resolveRouteMetadata } from '../seo/metadata'
import ToolPage, { Link } from '../tools/ToolPage'

const categories = [
  {
    id: 'calculators' as const,
    name: 'Calculadoras',
    description: 'Porcentajes y descuentos.',
    icon: Calculator,
  },
  {
    id: 'text' as const,
    name: 'Texto',
    description: 'Contadores y limpieza de texto.',
    icon: FileText,
  },
  {
    id: 'developer' as const,
    name: 'Desarrollo',
    description: 'JSON y codificación Base64.',
    icon: Code2,
  },
  {
    id: 'images' as const,
    name: 'Imágenes',
    description: 'Compresión, redimensionado y conversión.',
    icon: ImageIcon,
  },
]

function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <main id="main-content" className="page-shell">
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Microportal Tools, inicio">
          <span className="brand-mark"><Wrench size={19} aria-hidden="true" /></span>
          <span>microportal<span className="brand-light">.tools</span></span>
        </a>
        <span className="topbar-note"><ShieldCheck size={15} aria-hidden="true" />Privacidad primero</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <span className="eyebrow">HERRAMIENTAS SIMPLES. RESULTADOS RÁPIDOS.</span>
        <h1 id="hero-title">Todo lo útil, <span>sin complicaciones.</span></h1>
        <p className="hero-copy">
          Herramientas online gratuitas para resolver tareas cotidianas.
          Procesá tus datos directamente en el navegador, sin subirlos a un servidor.
        </p>
        <div className="search-placeholder" aria-label="Buscador de herramientas, próximamente">
          <Wrench size={18} aria-hidden="true" />
          <span>El buscador de herramientas estará disponible próximamente</span>
        </div>
      </section>

      <section className="tools-section" aria-labelledby="categories-title">
        <div className="section-heading">
          <div><span className="eyebrow">EXPLORÁ EL PORTAL</span><h2 id="categories-title">¿Qué necesitás hacer?</h2></div>
          <span className="tool-count">{toolRegistry.length} herramientas disponibles</span>
        </div>
        <div className="category-grid">
          {categories.map(({ id, name, description, icon: Icon }) => {
            const tools = getToolsByCategory(id)
            return (
              <article className="category-card" key={id}>
                <span className="category-icon"><Icon size={21} aria-hidden="true" /></span>
                <h3>{name}</h3>
                <p>{description}</p>
                {tools.length > 0 ? (
                  <ul className="category-tool-list">
                    {tools.map((tool) => <li key={tool.id}><Link href={`/herramientas/${tool.slug}`}>{tool.name}</Link></li>)}
                  </ul>
                ) : <span className="card-status">Próximamente · Stage 5</span>}
              </article>
            )
          })}
        </div>
      </section>

      <section className="privacy-note" aria-label="Compromiso de privacidad">
        <ShieldCheck size={22} aria-hidden="true" />
        <div><h2>Tu privacidad importa</h2><p>Las herramientas de esta etapa procesan tus entradas localmente en el navegador. No se envían a un servidor.</p></div>
      </section>
      <footer className="footer"><span>© {new Date().getFullYear()} Microportal Tools</span><span>Rápido · Claro · Privacidad primero</span></footer>
      </main>
    </>
  )
}

function NotFoundPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <main id="main-content" className="page-shell not-found">
      <header className="topbar"><a className="brand" href={import.meta.env.BASE_URL}>microportal<span className="brand-light">.tools</span></a></header>
      <h1>No encontramos esa herramienta</h1>
      <p>La dirección puede haber cambiado o la herramienta no existe.</p>
      <Link className="primary-link" href="/">Volver al inicio</Link>
      </main>
    </>
  )
}

export interface AppProps {
  /** Override the browser path when rendering static route snapshots. */
  pathname?: string
}

export default function App({ pathname = window.location.pathname }: AppProps) {
  const route = resolveRouteMetadata(pathname)

  useEffect(() => {
    document.title = route.title
    let description = document.querySelector('meta[name="description"]')
    if (!description) {
      description = document.createElement('meta')
      description.setAttribute('name', 'description')
      document.head.appendChild(description)
    }
    description.setAttribute('content', route.description)
  }, [route.title, route.description])

  if (route.kind === 'home') return <HomePage />
  if (route.kind === 'tool' && route.tool) return <ToolPage tool={route.tool} />
  return <NotFoundPage />
}

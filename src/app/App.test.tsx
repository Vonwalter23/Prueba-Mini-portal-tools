import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

const originalPath = window.location.pathname

afterEach(() => {
  window.history.replaceState({}, '', originalPath)
})

describe('App routing', () => {
  it('renders the heading, categories, and links to all eight tools', () => {
    window.history.replaceState({}, '', '/')
    render(<App />)

    expect(screen.getByRole('heading', { name: /todo lo útil/i })).toBeInTheDocument()
    for (const name of ['Calculadoras', 'Texto', 'Desarrollo', 'Imágenes']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    for (const name of [
      'Formateador y validador JSON',
      'Contador de palabras y caracteres',
      'Calculadora de porcentajes y descuentos',
      'Limpiador de texto',
      'Codificador y decodificador Base64',
      'Compresor de imágenes',
      'Redimensionador de imágenes',
      'Conversor de imágenes',
    ]) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('renders a tool when its route is loaded directly', () => {
    window.history.replaceState({}, '', '/herramientas/json-formatter')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Formateador y validador JSON' })).toBeInTheDocument()
    expect(screen.getByLabelText('Entrada')).toBeInTheDocument()
  })

  it('renders a not-found page for unknown routes', () => {
    window.history.replaceState({}, '', '/no-existe')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'No encontramos esa herramienta' })).toBeInTheDocument()
  })
})

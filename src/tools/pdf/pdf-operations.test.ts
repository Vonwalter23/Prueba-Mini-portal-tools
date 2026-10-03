import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { processPdf } from './pdf-operations'

async function makePdf(pageCount: number, name = 'sample.pdf'): Promise<File> {
  const document = await PDFDocument.create()
  for (let index = 0; index < pageCount; index += 1) document.addPage([300, 400])
  const bytes = await document.save()
  const file = new File([bytes], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) })
  return file
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.readAsArrayBuffer(blob)
  })
}

async function outputPageCount(blob: Blob): Promise<number> {
  return (await PDFDocument.load(await blobToArrayBuffer(blob))).getPageCount()
}

describe('PDF page operations', () => {
  it('merges multiple PDFs in selected file order', async () => {
    const first = await makePdf(2, 'first.pdf')
    const second = await makePdf(1, 'second.pdf')
    const result = await processPdf({ operation: 'merge', files: [first, second] })
    expect(result.filename).toBe('pdf-unidos.pdf')
    expect(await outputPageCount(result.blob)).toBe(3)
  })

  it('extracts selected pages and preserves requested order', async () => {
    const file = await makePdf(4)
    const result = await processPdf({ operation: 'split', files: [file], pages: '4, 2-3' })
    expect(await outputPageCount(result.blob)).toBe(3)
  })

  it('reorders pages according to the supplied list', async () => {
    const file = await makePdf(3)
    const result = await processPdf({ operation: 'reorder', files: [file], pages: '3, 1, 2' })
    expect(await outputPageCount(result.blob)).toBe(3)
  })

  it('removes selected pages', async () => {
    const file = await makePdf(4)
    const result = await processPdf({ operation: 'remove', files: [file], pages: '2, 4' })
    expect(await outputPageCount(result.blob)).toBe(2)
  })

  it('rotates every page by the selected angle', async () => {
    const file = await makePdf(2)
    const result = await processPdf({ operation: 'rotate', files: [file], rotation: 180 })
    const output = await PDFDocument.load(await blobToArrayBuffer(result.blob))
    expect(output.getPages().map((page) => page.getRotation().angle)).toEqual([180, 180])
  })

  it.each([
    ['', 'Indicá las páginas'],
    ['0', 'no existe'],
    ['1, 1', 'No repitas'],
    ['3-2', 'no es válido'],
  ])('rejects invalid page selection %s', async (pages, message) => {
    await expect(processPdf({ operation: 'split', files: [await makePdf(2)], pages }))
      .rejects.toThrow(message)
  })

  it('does not allow deleting every page', async () => {
    await expect(processPdf({ operation: 'remove', files: [await makePdf(2)], pages: '1-2' }))
      .rejects.toThrow('No podés eliminar todas las páginas')
  })

  it('requires at least two files for merge', async () => {
    await expect(processPdf({ operation: 'merge', files: [await makePdf(1)] }))
      .rejects.toThrow('al menos dos')
  })

  it('rejects malformed PDF input without exposing parser details', async () => {
    const file = new File(['not a PDF'], 'broken.pdf', { type: 'application/pdf' })
    await expect(processPdf({ operation: 'rotate', files: [file] }))
      .rejects.toThrow('No se pudo abrir "broken.pdf"')
  })
})

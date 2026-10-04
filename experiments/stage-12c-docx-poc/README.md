# STAGE 12C — PoC aislada DOCX → impresión PDF

Publicada únicamente en el portal público de pruebas para validar la experiencia en escritorio y Android Chrome. No forma parte del registro ni del router de herramientas del producto.

## Qué prueba

Ruta experimental: `docx-preview` → HTML → diálogo nativo de impresión del navegador → “Guardar como PDF”. No es conversión de producción ni garantiza equivalencia con Microsoft Word. El usuario debe elegir guardar como PDF.

## Privacidad y límites

- El archivo se lee con `file.arrayBuffer()` y se procesa en el navegador.
- No se añade backend, API de conversión, analytics, telemetría ni almacenamiento persistente.
- La librería se descarga como parte de los assets del sitio; inspeccione Network para comprobar que al seleccionar/renderizar no se envía el documento ni se producen solicitudes externas inesperadas.
- Límite experimental: 20 MiB. No es un límite aprobado para producto.
- Use exclusivamente documentos sintéticos; no suba documentos personales, laborales ni confidenciales.

## Corpus de prueba

Preparar DOCX sintéticos con: (1) texto, títulos, negrita, cursiva y acentos; (2) varias páginas y saltos; (3) tablas simples y largas; (4) imágenes y listas; (5) encabezado, pie y numeración; (6) fuentes no estándar; (7) archivo vacío, inválido y cercano a 20 MiB.

## Checklist manual pendiente

- [ ] Escritorio: probar todos los casos del corpus.
- [ ] Android Chrome: probar selección, vista previa, diálogo de impresión y guardado.
- [ ] DevTools/Network: confirmar que el contenido DOCX no se transmite y registrar cualquier solicitud.
- [ ] Abrir los PDF resultantes y comprobar selección/búsqueda de texto.
- [ ] Registrar fidelidad, saltos, tamaño de salida, tiempo, errores y consumo de memoria.
- [ ] Documentar resultados y limitaciones antes de decidir si procede una implementación de producto.

La publicación es temporal y experimental. No autoriza integración en la aplicación principal, merge de la PoC privada, dominio propio, producción, analytics, monetización ni sincronización de otras herramientas.

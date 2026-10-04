# Prueba técnica de Mini Portal Tools

Repositorio público independiente destinado exclusivamente a pruebas técnicas temporales de compatibilidad con GitHub Pages.

## Alcance y límites

- No es el entorno de producción ni el hosting definitivo.
- No incluir datos sensibles, secretos, credenciales ni documentación interna del proyecto privado.
- La publicación de GitHub Pages es manual mediante el workflow `Publish temporary GitHub Pages test`; los cambios en `main` no despliegan automáticamente.
- No configurar dominio propio, DNS, analytics ni monetización en esta prueba.
- La PoC STAGE 12C permanece aislada del registro y del router de herramientas del portal.

## STAGE 12C — PoC DOCX a PDF

Cuando se autorice y ejecute el workflow de publicación, la PoC estará disponible en:

`/Prueba-Mini-portal-tools/experiments/stage-12c-docx-poc/`

La compilación de la PoC se incorpora al artefacto estático bajo esa ruta sin integrarla en la aplicación principal. La publicación requiere autorización explícita y no se ejecuta automáticamente al fusionar cambios.

Consulte el [README de STAGE 12C](experiments/stage-12c-docx-poc/README.md) para conocer el alcance, las restricciones de privacidad y el corpus de pruebas.

## Estado

La PoC está preparada en el repositorio y el workflow está siendo adaptado para incluir su compilación aislada. No se debe considerar publicada hasta completar una ejecución autorizada del workflow y verificar la URL resultante.

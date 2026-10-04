import { renderAsync } from "docx-preview";
import "./styles.css";
const input = document.querySelector("#docx-file");
const preview = document.querySelector("#preview");
const status = document.querySelector("#status");
const printButton = document.querySelector("#print-button");
const clearButton = document.querySelector("#clear-button");
function clearPreview() { preview.replaceChildren(); printButton.disabled = true; clearButton.disabled = true; input.value = ""; status.textContent = "Seleccione un archivo DOCX de prueba."; }
input.addEventListener("change", async () => {
 const file = input.files?.[0]; preview.replaceChildren(); printButton.disabled = true; clearButton.disabled = true; if (!file) return;
 if (!file.name.toLowerCase().endsWith(".docx")) { status.textContent = "Formato no admitido. Seleccione un archivo .docx."; return; }
 if (!file.size) { status.textContent = "El archivo está vacío."; return; }
 if (file.size > 20 * 1024 * 1024) { status.textContent = "El archivo supera el límite experimental de 20 MiB."; return; }
 status.textContent = "Procesando localmente…"; input.disabled = true;
 try { await renderAsync(await file.arrayBuffer(), preview, preview, { className: "docx-preview", inWrapper: true, ignoreWidth: false, ignoreHeight: false, ignoreFonts: false, breakPages: true, renderHeaders: true, renderFooters: true, renderFootnotes: true, renderEndnotes: true, useBase64URL: true }); printButton.disabled = false; clearButton.disabled = false; status.textContent = "Vista previa lista. Compruebe la maquetación y use Imprimir / Guardar como PDF."; }
 catch (error) { preview.replaceChildren(); status.textContent = `No se pudo interpretar el DOCX: ${error instanceof Error ? error.message : "Error desconocido"}`; }
 finally { input.disabled = false; }
});
printButton.addEventListener("click", () => window.print());
clearButton.addEventListener("click", clearPreview);

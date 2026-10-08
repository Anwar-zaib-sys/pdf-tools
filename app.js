import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

const { PDFDocument } = window.PDFLib;
const state = {
  mergeFiles: [],
  removeFile: null,
  removePdf: null,
  removedPages: new Set(),
  compressFiles: [],
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};
const safeName = (name, suffix) => `${name.replace(/\.pdf$/i, "")}${suffix}.pdf`;

function toast(message, type = "normal") {
  const element = $("#toast");
  element.textContent = message;
  element.className = `toast show ${type === "error" ? "error" : ""}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 3600);
}

function setBusy(show, title = "Working on your PDF…", detail = "This can take a moment.", percent = 6) {
  $("#busy").hidden = !show;
  $("#busy-title").textContent = title;
  $("#busy-detail").textContent = detail;
  $("#busy-progress").style.width = `${percent}%`;
}

function updateBusy(detail, percent) {
  $("#busy-detail").textContent = detail;
  $("#busy-progress").style.width = `${Math.max(6, Math.min(100, percent))}%`;
}

function downloadBytes(bytes, filename, mime = "application/pdf") {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function validPdfFiles(fileList) {
  const files = [...fileList];
  const valid = files.filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
  if (valid.length !== files.length) toast("Only PDF files can be used here.", "error");
  return valid;
}

function switchTool(tool) {
  $$(".tool-tab").forEach((tab) => {
    const selected = tab.dataset.tool === tool;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  $$(".tool-panel").forEach((panel) => {
    const selected = panel.id === `${tool}-panel`;
    panel.classList.toggle("active", selected);
    panel.hidden = !selected;
  });
}

function setupDropzone(name, onFiles) {
  const zone = $(`[data-dropzone="${name}"]`);
  const input = $(`#${name}-input`);
  zone.addEventListener("click", () => input.click());
  zone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); input.click(); }
  });
  input.addEventListener("change", () => { onFiles(validPdfFiles(input.files)); input.value = ""; });
  ["dragenter", "dragover"].forEach((eventName) => zone.addEventListener(eventName, (event) => {
    event.preventDefault(); zone.classList.add("dragover");
  }));
  ["dragleave", "drop"].forEach((eventName) => zone.addEventListener(eventName, (event) => {
    event.preventDefault(); zone.classList.remove("dragover");
  }));
  zone.addEventListener("drop", (event) => onFiles(validPdfFiles(event.dataTransfer.files)));
}

async function inspectPdf(file) {
  const buffer = await file.arrayBuffer();
  const structure = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const previewDocument = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const firstPage = await previewDocument.getPage(1);
  const natural = firstPage.getViewport({ scale: 1 });
  const viewport = firstPage.getViewport({ scale: Math.min(1, 190 / natural.width) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await firstPage.render({ canvasContext: context, viewport }).promise;
  firstPage.cleanup();
  const thumbnail = canvas.toDataURL("image/jpeg", .8);
  await previewDocument.destroy();
  return { pageCount: structure.getPageCount(), thumbnail };
}

async function addMergeFiles(files) {
  if (!files.length) return;
  setBusy(true, "Reading PDFs…", "Checking page counts.", 20);
  try {
    for (const file of files) {
      updateBusy(`Preparing preview for ${file.name}`, 20 + state.mergeFiles.length * 8);
      const { pageCount, thumbnail } = await inspectPdf(file);
      state.mergeFiles.push({ id: crypto.randomUUID(), file, pageCount, thumbnail });
    }
    renderMergeList();
  } catch (error) {
    console.error(error);
    toast("One of those PDFs could not be opened. It may be encrypted or damaged.", "error");
  } finally { setBusy(false); }
}

function renderMergeList() {
  const list = $("#merge-list");
  list.innerHTML = "";
  state.mergeFiles.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "file-row";
    row.draggable = true;
    row.dataset.id = item.id;
    row.innerHTML = `<span class="drag-handle" title="Drag to change position" aria-hidden="true"><i data-lucide="grip-vertical"></i></span><span class="merge-preview"><img src="${item.thumbnail}" alt="First page of ${escapeHtml(item.file.name)}" /><span class="order-badge">${index + 1}</span></span><span class="file-meta"><strong title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</strong><span class="muted">${item.pageCount} page${item.pageCount === 1 ? "" : "s"}</span></span><span class="muted">${formatBytes(item.file.size)}</span><span class="row-actions"><button class="icon-button move-up" aria-label="Move ${escapeHtml(item.file.name)} up" ${index === 0 ? "disabled" : ""}><i data-lucide="chevron-up"></i></button><button class="icon-button move-down" aria-label="Move ${escapeHtml(item.file.name)} down" ${index === state.mergeFiles.length - 1 ? "disabled" : ""}><i data-lucide="chevron-down"></i></button><button class="icon-button remove-merge" aria-label="Remove ${escapeHtml(item.file.name)}"><i data-lucide="x"></i></button></span>`;
    row.querySelector(".remove-merge").addEventListener("click", () => {
      state.mergeFiles = state.mergeFiles.filter((entry) => entry.id !== item.id);
      renderMergeList();
    });
    row.querySelector(".move-up").addEventListener("click", () => moveMergeFile(index, index - 1));
    row.querySelector(".move-down").addEventListener("click", () => moveMergeFile(index, index + 1));
    row.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.id);
      requestAnimationFrame(() => row.classList.add("dragging"));
    });
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      $$(".file-row", list).forEach((entry) => entry.classList.remove("drop-before", "drop-after"));
      syncMergeOrder();
      renderMergeList();
    });
    row.addEventListener("dragover", (event) => {
      event.preventDefault(); event.dataTransfer.dropEffect = "move";
      const dragging = $(".file-row.dragging");
      if (!dragging || dragging === row) return;
      const rect = row.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      $$(".file-row", list).forEach((entry) => entry.classList.remove("drop-before", "drop-after"));
      row.classList.add(before ? "drop-before" : "drop-after");
      list.insertBefore(dragging, before ? row : row.nextSibling);
    });
    row.addEventListener("drop", (event) => { event.preventDefault(); syncMergeOrder(); });
    list.appendChild(row);
  });
  const count = state.mergeFiles.length;
  $("#merge-count").textContent = `${count} file${count === 1 ? "" : "s"}`;
  $("#merge-run").disabled = count < 2;
  $("#merge-work").classList.toggle("hidden", count === 0);
  $("[data-dropzone='merge']").classList.toggle("hidden", count > 0);
  window.lucide?.createIcons();
}

function moveMergeFile(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= state.mergeFiles.length || fromIndex === toIndex) return;
  const [moved] = state.mergeFiles.splice(fromIndex, 1);
  state.mergeFiles.splice(toIndex, 0, moved);
  renderMergeList();
}

function syncMergeOrder() {
  const ids = $$("#merge-list .file-row").map((row) => row.dataset.id);
  state.mergeFiles.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

async function mergePdfs() {
  if (state.mergeFiles.length < 2) return;
  setBusy(true, "Merging PDFs…", "Preparing the first file.", 8);
  try {
    syncMergeOrder();
    const output = await PDFDocument.create();
    for (let index = 0; index < state.mergeFiles.length; index++) {
      const item = state.mergeFiles[index];
      updateBusy(`Adding ${item.file.name}`, 12 + (index / state.mergeFiles.length) * 72);
      const source = await PDFDocument.load(await item.file.arrayBuffer(), { ignoreEncryption: true });
      const pages = await output.copyPages(source, source.getPageIndices());
      pages.forEach((page) => output.addPage(page));
    }
    output.setTitle("Merged PDF");
    output.setProducer("PDF Bench");
    updateBusy("Creating your download…", 92);
    const filename = getMergeOutputName();
    downloadBytes(await output.save({ useObjectStreams: true }), filename);
    toast("Merged PDF downloaded.");
  } catch (error) {
    console.error(error); toast("The PDFs could not be merged. Password-protected files are not supported.", "error");
  } finally { setBusy(false); }
}

function getMergeOutputName() {
  const input = $("#merge-output-name");
  const cleaned = input.value
    .replace(/\.pdf$/i, "")
    .replace(/[\\/:*?\"<>|\u0000-\u001F]/g, "-")
    .replace(/[. ]+$/g, "")
    .trim();
  const base = cleaned || "merged";
  input.value = base;
  return `${base}.pdf`;
}

async function loadRemoveFile(files) {
  if (!files.length) return;
  state.removeFile = files[0];
  state.removedPages.clear();
  setBusy(true, "Opening PDF…", "Preparing page previews.", 8);
  try {
    const bytes = new Uint8Array(await state.removeFile.arrayBuffer());
    state.removePdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    $("#remove-name").textContent = state.removeFile.name;
    $("[data-dropzone='remove']").classList.add("hidden");
    $("#remove-work").classList.remove("hidden");
    const grid = $("#page-grid");
    grid.innerHTML = "";
    for (let pageNumber = 1; pageNumber <= state.removePdf.numPages; pageNumber++) {
      updateBusy(`Rendering page ${pageNumber} of ${state.removePdf.numPages}`, 8 + pageNumber / state.removePdf.numPages * 84);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "page-card";
      card.dataset.page = String(pageNumber - 1);
      card.setAttribute("aria-pressed", "false");
      const canvas = document.createElement("canvas");
      const label = document.createElement("span");
      label.textContent = `Page ${pageNumber}`;
      card.append(canvas, label);
      grid.appendChild(card);
      const page = await state.removePdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 0.32 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      card.addEventListener("click", () => toggleRemovedPage(pageNumber - 1, card));
    }
    updateRemoveSummary();
  } catch (error) {
    console.error(error); resetRemove(); toast("That PDF could not be opened. It may be encrypted or damaged.", "error");
  } finally { setBusy(false); }
}

function toggleRemovedPage(index, card) {
  if (state.removedPages.has(index)) state.removedPages.delete(index); else state.removedPages.add(index);
  card.classList.toggle("removed", state.removedPages.has(index));
  card.setAttribute("aria-pressed", String(state.removedPages.has(index)));
  updateRemoveSummary();
}

function updateRemoveSummary() {
  const total = state.removePdf?.numPages || 0;
  const removed = state.removedPages.size;
  $("#remove-summary").textContent = `${formatBytes(state.removeFile?.size || 0)} · ${total} pages · ${removed} selected for removal`;
  $("#remove-run").disabled = removed === 0 || removed >= total;
}

function resetRemove() {
  state.removeFile = null; state.removePdf = null; state.removedPages.clear();
  $("#page-grid").innerHTML = "";
  $("#remove-work").classList.add("hidden");
  $("[data-dropzone='remove']").classList.remove("hidden");
}

async function removePages() {
  if (!state.removeFile || !state.removedPages.size) return;
  setBusy(true, "Removing pages…", "Rebuilding your PDF.", 25);
  try {
    const source = await PDFDocument.load(await state.removeFile.arrayBuffer(), { ignoreEncryption: true });
    const keep = source.getPageIndices().filter((index) => !state.removedPages.has(index));
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, keep);
    pages.forEach((page) => output.addPage(page));
    output.setProducer("PDF Bench");
    updateBusy("Creating your download…", 90);
    downloadBytes(await output.save({ useObjectStreams: true }), safeName(state.removeFile.name, "-edited"));
    toast(`Downloaded with ${state.removedPages.size} page${state.removedPages.size === 1 ? "" : "s"} removed.`);
  } catch (error) {
    console.error(error); toast("The edited PDF could not be created.", "error");
  } finally { setBusy(false); }
}

function loadCompressFiles(files) {
  if (!files.length) return;
  const existing = new Set(state.compressFiles.map((item) => item.key));
  files.forEach((file) => {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (!existing.has(key)) {
      state.compressFiles.push({ id: crypto.randomUUID(), key, file });
      existing.add(key);
    }
  });
  renderCompressFiles();
}

function renderCompressFiles() {
  const list = $("#compress-list");
  list.innerHTML = "";
  state.compressFiles.forEach((item) => {
    const row = document.createElement("div");
    row.className = "compress-file-row";
    row.innerHTML = `<span class="pdf-badge">PDF</span><span class="file-meta"><strong title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</strong><span class="muted">Ready to compress</span></span><span class="muted">${formatBytes(item.file.size)}</span><button class="icon-button" aria-label="Remove ${escapeHtml(item.file.name)}"><i data-lucide="x"></i></button>`;
    row.querySelector("button").addEventListener("click", () => {
      state.compressFiles = state.compressFiles.filter((entry) => entry.id !== item.id);
      renderCompressFiles();
    });
    list.appendChild(row);
  });
  const count = state.compressFiles.length;
  $("#compress-count").textContent = `${count} file${count === 1 ? "" : "s"} selected`;
  $("#compress-work").classList.toggle("hidden", count === 0);
  $("[data-dropzone='compress']").classList.toggle("hidden", count > 0);
  $("#compress-run").disabled = count === 0;
  window.lucide?.createIcons();
}

function resetCompress() {
  state.compressFiles = [];
  renderCompressFiles();
}

async function compressPdfs() {
  if (!state.compressFiles.length) return;
  const preset = $("input[name='quality']:checked").value;
  const settings = {
    light: { scale: 1.45, quality: .82 },
    balanced: { scale: 1.15, quality: .68 },
    strong: { scale: .88, quality: .5 },
  }[preset];
  setBusy(true, "Compressing PDFs…", "Preparing the first document.", 4);
  try {
    const zip = new window.JSZip();
    const usedNames = new Set();
    for (let fileIndex = 0; fileIndex < state.compressFiles.length; fileIndex++) {
      const { file } = state.compressFiles[fileIndex];
      updateBusy(`Opening ${file.name}`, 5 + fileIndex / state.compressFiles.length * 78);
      const result = await compressOnePdf(file, settings, (pageNumber, pageTotal) => {
        const fileProgress = (pageNumber / pageTotal) / state.compressFiles.length;
        updateBusy(`Compressing ${file.name} — page ${pageNumber} of ${pageTotal}`, 5 + (fileIndex / state.compressFiles.length + fileProgress) * 78);
      });
      zip.file(uniqueZipName(safeName(file.name, "-compressed"), usedNames), result);
    }
    updateBusy("Packaging compressed PDFs into a ZIP…", 88);
    const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } }, (metadata) => {
      updateBusy(`Creating ZIP — ${Math.round(metadata.percent)}%`, 88 + metadata.percent * .12);
    });
    downloadBytes(archive, "compressed-pdfs.zip", "application/zip");
    toast(`${state.compressFiles.length} compressed PDF${state.compressFiles.length === 1 ? "" : "s"} downloaded in one ZIP.`);
  } catch (error) {
    console.error(error); toast("The PDFs could not be compressed. Password-protected files are not supported.", "error");
  } finally { setBusy(false); }
}

async function compressOnePdf(file, settings, onProgress) {
  const sourceBytes = new Uint8Array(await file.arrayBuffer());
  const source = await pdfjsLib.getDocument({ data: sourceBytes }).promise;
  const output = await PDFDocument.create();
  output.setProducer("PDF Bench");
  for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
    onProgress(pageNumber, source.numPages);
    const page = await source.getPage(pageNumber);
    const viewport = page.getViewport({ scale: settings.scale });
    const pageSize = page.getViewport({ scale: 1 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const jpegBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", settings.quality));
    if (!jpegBlob) throw new Error("Image conversion failed");
    const jpeg = await output.embedJpg(await jpegBlob.arrayBuffer());
    const outputPage = output.addPage([pageSize.width, pageSize.height]);
    outputPage.drawImage(jpeg, { x: 0, y: 0, width: pageSize.width, height: pageSize.height });
    page.cleanup();
  }
  await source.destroy();
  return output.save({ useObjectStreams: true });
}

function uniqueZipName(filename, usedNames) {
  const stem = filename.replace(/\.pdf$/i, "");
  let candidate = filename;
  let counter = 2;
  while (usedNames.has(candidate.toLowerCase())) candidate = `${stem}-${counter++}.pdf`;
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

$$(".tool-tab").forEach((tab) => tab.addEventListener("click", () => switchTool(tab.dataset.tool)));
setupDropzone("merge", addMergeFiles);
setupDropzone("remove", loadRemoveFile);
setupDropzone("compress", loadCompressFiles);
$("#merge-add").addEventListener("click", () => $("#merge-input").click());
$("#merge-run").addEventListener("click", mergePdfs);
$("#merge-output-name").addEventListener("blur", getMergeOutputName);
$("#merge-output-name").addEventListener("focus", (event) => event.target.select(), { once: true });
$("#remove-reset").addEventListener("click", resetRemove);
$("#remove-run").addEventListener("click", removePages);
$("#compress-reset").addEventListener("click", resetCompress);
$("#compress-add").addEventListener("click", () => $("#compress-input").click());
$("#compress-run").addEventListener("click", compressPdfs);
$$(`input[name="quality"]`).forEach((input) => input.addEventListener("change", () => {
  $$(".quality-card").forEach((card) => card.classList.toggle("selected", card.contains($("input[name='quality']:checked"))));
}));
window.lucide?.createIcons();

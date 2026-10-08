<div align="center">

# PDF Bench

### Free, private, browser-based PDF tools

Merge PDFs, remove unwanted pages, and compress multiple documents without uploading your files to a server.

![No uploads](https://img.shields.io/badge/Privacy-No%20uploads-16845b?style=flat-square)
![Runs locally](https://img.shields.io/badge/Processing-Local-315ea9?style=flat-square)
![No account](https://img.shields.io/badge/Account-Not%20required-f05a47?style=flat-square)

</div>

---

## About PDF Bench

PDF Bench is a lightweight local alternative to online PDF utilities. It runs in your web browser and processes documents on your own device, so your PDF files are never sent to this project or stored on an external server.

It is designed to be simple enough for everyday users while still providing useful visual controls such as page previews, drag-and-drop ordering, and batch compression.

## Features

### Merge PDFs

- Upload multiple PDF files at once.
- See a preview of the first page of every document.
- Drag and drop files to change their merge order.
- Use move-up and move-down buttons on mobile or with a keyboard.
- Remove unwanted files before merging.
- Choose a custom filename for the merged PDF.
- Preserve the displayed file sequence in the downloaded document.

### Remove PDF pages

- Upload a PDF and view thumbnails of all its pages.
- Click individual pages to mark them for removal.
- See how many pages are selected before processing.
- Download a new PDF containing only the pages you kept.

### Compress PDFs

- Upload multiple PDF files in one batch.
- Choose between **Light**, **Balanced**, and **Strong** compression.
- Add more files or remove individual files from the queue.
- Compress every selected document locally in the browser.
- Download all compressed PDFs together in one ZIP archive.
- Automatically handle duplicate output filenames.

### Privacy and usability

- All document processing happens inside your browser.
- Files are not uploaded to a backend or cloud service.
- No registration or account is required.
- Responsive interface for desktop and mobile screens.
- Drag-and-drop upload support.
- Clear progress, success, and error messages.
- Keyboard-accessible controls and readable labels.

## Requirements

Before running PDF Bench for the first time, make sure you have:

- A modern browser such as Chrome, Edge, Firefox, or Safari.
- Python 3 installed for starting the local web server.
- An internet connection when opening the app, because PDF.js, pdf-lib, JSZip, and Lucide icons are loaded from jsDelivr.
- Enough available memory for the PDFs you want to process. Very large documents may require more time and memory.

> Your PDF contents remain local even though the app downloads its JavaScript libraries from a CDN.

## Run for the first time

### Windows — easiest method

1. Download or clone this repository.
2. Open the project folder.
3. Double-click `run_pdf_app.bat`.
4. PDF Bench will start and open automatically in your default browser.
5. Keep the command window open while using the app.
6. Press `Ctrl+C` in that window when you want to stop the server.

If Windows reports that Python is missing, install it from [python.org](https://www.python.org/downloads/) and enable **Add Python to PATH** during installation.

### Windows — manual method

Open PowerShell inside the project folder and run:

```powershell
python -m http.server 4173
```

If the `python` command is unavailable, try:

```powershell
py -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173).

### macOS or Linux

Open a terminal inside the project folder and run:

```bash
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173).

## How to use

### Merge PDF files

1. Select **Merge PDFs**.
2. Drop two or more PDFs into the upload area, or click it to choose files.
3. Check each document using its first-page preview.
4. Drag the files into the desired sequence. The numbered badges show the final order.
5. Enter a name in the **Output filename** field.
6. Select **Merge PDFs** to download the result.

### Remove pages from a PDF

1. Select **Remove pages**.
2. Upload one PDF.
3. Click every page that you want to remove.
4. Review the selection count.
5. Select **Download edited PDF**.

### Compress multiple PDFs

1. Select **Compress PDF**.
2. Upload one or more PDF files.
3. Add or remove files until the queue is correct.
4. Choose a compression level.
5. Select **Compress PDFs & download ZIP**.
6. Open `compressed-pdfs.zip` to access the compressed documents.

## Compression levels

- **Light:** prioritizes sharper pages and produces a larger result.
- **Balanced:** provides a practical balance between visual quality and file size.
- **Strong:** creates the smallest result but may make pages look softer.

Compression rebuilds each page as an image. This significantly helps image-heavy or scanned documents, but text in the compressed result will no longer be selectable or searchable. A PDF that is already highly optimized may not become much smaller.

## Important limitations

- Password-protected or encrypted PDFs are not supported.
- Compression rasterizes pages and removes selectable text, links, forms, and other interactive PDF features.
- Processing extremely large documents may be limited by the browser's available memory.
- The current version needs internet access to load its browser libraries.

## Project files

- `index.html` — application structure and controls.
- `styles.css` — responsive design and visual styling.
- `app.js` — PDF processing, previews, reordering, compression, and ZIP creation.
- `run_pdf_app.bat` — one-click Windows launcher.

## Technology

PDF Bench is built with plain HTML, CSS, and JavaScript. It uses:

- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering and page previews.
- [pdf-lib](https://pdf-lib.js.org/) for creating, copying, and editing PDF documents.
- [JSZip](https://stuk.github.io/jszip/) for packaging batch-compressed PDFs.
- [Lucide](https://lucide.dev/) for interface icons.

No framework, database, account system, or backend server is required.

## Contributing

Contributions, bug reports, and feature suggestions are welcome. You can fork the repository, create a branch, make your changes, and open a pull request.

---

<div align="center">

Made with ❤️ by **Anwar Zaib**

</div>

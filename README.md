# PDF Bench

A private, browser-based PDF toolkit for merging files, removing pages, and compressing documents. Processing happens locally in the browser; files are not uploaded to a server.

## Run locally

The app loads its PDF libraries from jsDelivr, so the first page load needs an internet connection.

On Windows, double-click `run_pdf_app.bat`. It will start the local server and open PDF Bench in your default browser.

Or start it manually:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

You can also use any static-file server, such as `npx serve .`.

## Tools

- **Merge PDFs:** add multiple files, drag to reorder, and download one merged PDF.
- **Remove pages:** view page thumbnails, mark pages for removal, and download the edited file.
- **Compress PDFs:** add one or more files, choose light, balanced, or strong compression, and download all compressed PDFs in one ZIP. Compression rasterizes pages, so text in the results is no longer selectable.

## Privacy

All PDF processing is performed in the browser with PDF.js and pdf-lib. No document data is sent to this project or stored by it.

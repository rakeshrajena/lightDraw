/** Minimal PDF writer — zero dependencies (Phase 10). */

export interface PdfImagePage {
  /** Raw JPEG bytes (DCTDecode) */
  jpeg: Uint8Array;
  width: number;
  height: number;
}

function encoder(): TextEncoder {
  return new TextEncoder();
}

function mergeChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

/** Build a multi-page PDF embedding JPEG images. */
export function buildPdfFromJpegPages(pages: PdfImagePage[]): Uint8Array {
  if (pages.length === 0) {
    return encoder().encode('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
  }

  const enc = encoder();
  const parts: Uint8Array[] = [];
  let pos = 0;
  const offsets: number[] = [0];

  const append = (text: string): void => {
    const b = enc.encode(text);
    parts.push(b);
    pos += b.length;
  };

  const appendBytes = (bytes: Uint8Array): void => {
    parts.push(bytes);
    pos += bytes.length;
  };

  const startObj = (id: number, header: string): void => {
    while (offsets.length <= id) offsets.push(0);
    offsets[id] = pos;
    append(`${id} 0 obj\n${header}`);
  };

  append('%PDF-1.4\n');

  const n = pages.length;
  const imgIds: number[] = [];
  const contentIds: number[] = [];
  const pageIds: number[] = [];
  let id = 1;

  for (let i = 0; i < n; i++) {
    imgIds.push(id++);
    contentIds.push(id++);
    pageIds.push(id++);
  }
  const pagesTreeId = id++;
  const catalogId = id++;

  for (let i = 0; i < n; i++) {
    const page = pages[i];
    const imgId = imgIds[i];
    startObj(
      imgId,
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`
    );
    appendBytes(page.jpeg);
    append('\nendstream\nendobj\n');

    const imgName = `Im${imgId}`;
    const ops = `q ${page.width} 0 0 ${page.height} 0 0 cm /${imgName} Do Q`;
    const opsBytes = enc.encode(ops);
    const contentId = contentIds[i];
    startObj(contentId, `<< /Length ${opsBytes.length} >>\nstream\n`);
    appendBytes(opsBytes);
    append('\nendstream\nendobj\n');

    const pageId = pageIds[i];
    startObj(
      pageId,
      `<< /Type /Page /Parent ${pagesTreeId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] ` +
        `/Contents ${contentId} 0 R /Resources << /XObject << /${imgName} ${imgId} 0 R >> >> >>\nendobj\n`
    );
  }

  const kids = pageIds.map((p) => `${p} 0 R`).join(' ');
  startObj(pagesTreeId, `<< /Type /Pages /Kids [${kids}] /Count ${n} >>\nendobj\n`);
  startObj(catalogId, `<< /Type /Catalog /Pages ${pagesTreeId} 0 R >>\nendobj\n`);

  const xrefPos = pos;
  append(`xref\n0 ${catalogId + 1}\n`);
  append('0000000000 65535 f \n');
  for (let i = 1; i <= catalogId; i++) {
    append(`${String(offsets[i] ?? 0).padStart(10, '0')} 00000 n \n`);
  }
  append(`trailer\n<< /Size ${catalogId + 1} /Root ${catalogId} 0 R >>\n`);
  append(`startxref\n${xrefPos}\n%%EOF\n`);

  return mergeChunks(parts);
}

/** Encode PDF bytes as base64 data URI. */
export function pdfToDataUrl(pdf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < pdf.length; i++) {
    binary += String.fromCharCode(pdf[i]);
  }
  return `data:application/pdf;base64,${btoa(binary)}`;
}

/** Decode base64 data URL to bytes. */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Minimal JPEG stub with valid SOI/EOI markers for PDF structure tests. */
export function createMinimalJpegStub(width: number, height: number): Uint8Array {
  const header = encoder().encode(
    `\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00`
  );
  const comment = encoder().encode(`LIGHTDRAW ${width}x${height}`);
  const eoi = new Uint8Array([0xff, 0xd9]);
  const out = new Uint8Array(header.length + comment.length + eoi.length);
  out.set(header, 0);
  out.set(comment, header.length);
  out.set(eoi, header.length + comment.length);
  return out;
}

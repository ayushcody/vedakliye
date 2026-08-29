"use client";

import type { PageImage } from "./types";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function imageFileToPages(file: File): Promise<PageImage[]> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const MAX_DIM = 1600;
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (width > MAX_DIM || height > MAX_DIM) {
    if (width > height) {
      height = Math.round((height * MAX_DIM) / width);
      width = MAX_DIM;
    } else {
      width = Math.round((width * MAX_DIM) / height);
      height = MAX_DIM;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    return [
      {
        page: 0,
        dataUrl: canvas.toDataURL("image/jpeg", 0.5),
        width: img.naturalWidth,
        height: img.naturalHeight,
      },
    ];
  }

  return [
    {
      page: 0,
      dataUrl,
      width: img.naturalWidth,
      height: img.naturalHeight,
    },
  ];
}

async function pdfFileToPages(file: File): Promise<PageImage[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pages: PageImage[] = [];
  const targetScale = 1.3; // Reduced to prevent Vercel 4.5MB payload limit errors

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
    pages.push({
      page: i - 1,
      dataUrl,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}

/**
 * Converts an uploaded File (PDF or image) into an array of page images
 * (data URLs), suitable for sending to the extraction API and for
 * rendering in the answer sheet viewer.
 */
export async function fileToPages(file: File): Promise<PageImage[]> {
  if (file.type === "application/pdf") {
    return pdfFileToPages(file);
  }
  if (file.type.startsWith("image/")) {
    return imageFileToPages(file);
  }
  throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
}

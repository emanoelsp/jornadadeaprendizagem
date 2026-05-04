import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { parseDetailedExamText } from "@/features/enade/exam-parser";

export const runtime = "nodejs";

async function extractPdfText(buffer: Buffer) {
  PDFParse.setWorker(
    pathToFileURL(path.join(process.cwd(), "node_modules/pdf-parse/dist/worker/pdf.worker.mjs")).href,
  );
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function GET() {
  const provasDir = path.join(process.cwd(), "provas");
  const fileNames = (await readdir(provasDir)).filter((fileName) =>
    fileName.toLowerCase().endsWith(".pdf"),
  );
  const analyses = await Promise.all(
    fileNames.map(async (fileName) => {
      const buffer = await readFile(path.join(provasDir, fileName));
      const text = await extractPdfText(buffer);
      return parseDetailedExamText(text, fileName);
    }),
  );

  return NextResponse.json({ analyses });
}

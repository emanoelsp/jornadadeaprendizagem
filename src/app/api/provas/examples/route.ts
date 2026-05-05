import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { parseDetailedExamText } from "@/features/enade/exam-parser";

export const runtime = "nodejs";

// Configurar worker uma vez
let workerConfigured = false;
function configureWorker() {
  if (workerConfigured) return;
  try {
    const workerPath = path.join(process.cwd(), "node_modules/pdf-parse/dist/worker/pdf.worker.mjs");
    PDFParse.setWorker(pathToFileURL(workerPath).href);
    workerConfigured = true;
  } catch (error) {
    console.error("[v0] Erro ao configurar worker:", error);
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  configureWorker();
  
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function GET() {
  try {
    const provasDir = path.join(process.cwd(), "provas");
    
    let fileNames: string[];
    try {
      fileNames = (await readdir(provasDir)).filter((fileName) =>
        fileName.toLowerCase().endsWith(".pdf"),
      );
    } catch (error) {
      // Pasta não existe em produção - retornar lista vazia
      console.error("[v0] Pasta provas nao encontrada:", error);
      return NextResponse.json({ analyses: [] });
    }

    if (fileNames.length === 0) {
      return NextResponse.json({ analyses: [] });
    }

    const analyses = await Promise.all(
      fileNames.map(async (fileName) => {
        try {
          const buffer = await readFile(path.join(provasDir, fileName));
          const text = await extractPdfText(buffer);
          return parseDetailedExamText(text, fileName);
        } catch (error) {
          console.error(`[v0] Erro ao processar ${fileName}:`, error);
          return null;
        }
      }),
    );

    // Filtrar análises que falharam
    const validAnalyses = analyses.filter((a) => a !== null);

    return NextResponse.json({ analyses: validAnalyses });
  } catch (error) {
    console.error("[v0] Erro na API examples:", error);
    return NextResponse.json(
      { error: "Erro ao carregar provas de exemplo", details: String(error) },
      { status: 500 }
    );
  }
}

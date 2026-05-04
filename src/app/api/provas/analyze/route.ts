import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseDetailedExamText } from "@/features/enade/exam-parser";

export const runtime = "nodejs";

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function extractPdfText(file: File) {
  PDFParse.setWorker(
    pathToFileURL(path.join(process.cwd(), "node_modules/pdf-parse/dist/worker/pdf.worker.mjs")).href,
  );
  const parser = new PDFParse({
    data: Buffer.from(await file.arrayBuffer()),
  });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo de prova não enviado." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "A análise detalhada da prova deve ser enviada em PDF." },
      { status: 400 },
    );
  }

  const text = await extractPdfText(file);
  const analysis = parseDetailedExamText(text, file.name);
  let blobUrl: string | undefined;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`enade/provas/${Date.now()}-${safeFileName(file.name)}`, file, {
      access: "private",
      addRandomSuffix: true,
    });
    blobUrl = blob.url;
  }

  return NextResponse.json({
    analysis: {
      ...analysis,
      blobUrl,
    },
    document: {
      id: `prova-${Date.now()}`,
      fileName: file.name,
      fileType: "pdf",
      classNames: [analysis.classLabel],
      uploadedAt: new Date().toISOString(),
      blobUrl,
      status: blobUrl ? "processado" : "pendente_configuracao",
      importedResponses: 0,
    },
  });
}

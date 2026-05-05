import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 });
  }

  try {
    const blob = await get(url);

    if (!blob) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      contentType: blob.contentType,
    });
  } catch (error) {
    console.error("[v0] Erro ao buscar blob:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar arquivo" },
      { status: 500 }
    );
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";

// Configurar worker do pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type QuestionImageViewerProps = {
  blobUrl?: string;
  pageNumber?: number;
  questionTitle: string;
};

export function QuestionImageViewer({
  blobUrl,
  pageNumber = 1,
  questionTitle,
}: QuestionImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Carregar PDF quando abrir o modal
  useEffect(() => {
    if (!isOpen || !blobUrl) return;

    async function loadPdf() {
      setIsLoading(true);
      setError(null);

      try {
        // Carregar o PDF diretamente da URL do Vercel Blob
        const loadingTask = pdfjsLib.getDocument(blobUrl);
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        setPdfTotalPages(pdf.numPages);
        
        // Renderizar pagina inicial
        await renderPage(pdf, currentPage);
      } catch (err) {
        console.error("[v0] Erro ao carregar PDF:", err);
        setError("Erro ao carregar o PDF. Verifique se o arquivo foi enviado corretamente.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPdf();

    return () => {
      if (pdfDocRef.current) {
        void pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [isOpen, blobUrl]);

  // Renderizar pagina quando mudar
  useEffect(() => {
    if (!isOpen || !pdfDocRef.current) return;
    void renderPage(pdfDocRef.current, currentPage);
  }, [currentPage, scale, isOpen]);

  async function renderPage(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number) {
    if (!canvasRef.current) return;

    setIsLoading(true);
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;
    } catch (err) {
      console.error("[v0] Erro ao renderizar pagina:", err);
      setError("Erro ao renderizar a pagina do PDF.");
    } finally {
      setIsLoading(false);
    }
  }

  function handlePrevPage() {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  function handleNextPage() {
    if (currentPage < pdfTotalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  function handleZoomIn() {
    if (scale < 3) {
      setScale(scale + 0.25);
    }
  }

  function handleZoomOut() {
    if (scale > 0.5) {
      setScale(scale - 0.25);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setCurrentPage(pageNumber);
    setScale(1.5);
    setError(null);
    if (pdfDocRef.current) {
      void pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }
  }

  if (!blobUrl) {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <Eye className="h-4 w-4" />
        Ver questao
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Visualizar ${questionTitle}`}
        >
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col rounded-lg bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold">{questionTitle}</h2>
                <span className="text-sm text-muted-foreground">
                  Pagina {currentPage} de {pdfTotalPages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  aria-label="Diminuir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[3rem] text-center text-sm">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleZoomIn}
                  disabled={scale >= 3}
                  aria-label="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleClose}
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Conteudo */}
            <div className="relative flex-1 overflow-auto p-4">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setError(null);
                      setIsOpen(false);
                      setTimeout(() => setIsOpen(true), 100);
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="mx-auto rounded-lg border shadow-sm"
                />
              )}
            </div>

            {/* Navegacao de paginas */}
            {pdfTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t px-4 py-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {pdfTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage >= pdfTotalPages || isLoading}
                >
                  Proxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

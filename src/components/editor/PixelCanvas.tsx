import { useCallback, useEffect, useRef, useState } from "react";
import type { PixelEditorEngine } from "../../editor/PixelEditorEngine";

interface PixelCanvasProps {
  engine: PixelEditorEngine;
  zoom: number;
  showGrid: boolean;
}

interface PixelCoords {
  x: number;
  y: number;
}

/**
 * Canvas de edicao de verdade: desenha a COMPOSICAO de todas as camadas
 * do PixelEditorEngine escalada (sem suavizacao) e traduz eventos de
 * ponteiro em coordenadas de pixel da textura, delegando para o engine
 * (que aplica na camada ativa).
 */
export function PixelCanvas({ engine, zoom, showGrid }: PixelCanvasProps) {
  const displayRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const pixelSize = zoom / 100;
  const [hoverPixel, setHoverPixel] = useState<PixelCoords | null>(null);

  const redraw = useCallback(() => {
    const display = displayRef.current;
    if (!display) return;

    if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas");
    const offscreen = offscreenRef.current;
    offscreen.width = engine.width;
    offscreen.height = engine.height;
    offscreen.getContext("2d")?.putImageData(engine.getComposite(), 0, 0);

    const displayWidth = engine.width * pixelSize;
    const displayHeight = engine.height * pixelSize;
    display.width = displayWidth;
    display.height = displayHeight;

    const ctx = display.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.drawImage(offscreen, 0, 0, displayWidth, displayHeight);

    if (showGrid) {
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= engine.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize + 0.5, 0);
        ctx.lineTo(x * pixelSize + 0.5, displayHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= engine.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize + 0.5);
        ctx.lineTo(displayWidth, y * pixelSize + 0.5);
        ctx.stroke();
      }
    }

    // Destaque sutil (cor de destaque do tema) no pixel abaixo do mouse -
    // so contorno, sem preencher, para nao escurecer/colorir o pixel real.
    if (hoverPixel) {
      ctx.strokeStyle = "rgba(34,211,238,0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        hoverPixel.x * pixelSize + 0.5,
        hoverPixel.y * pixelSize + 0.5,
        pixelSize - 1,
        pixelSize - 1,
      );
    }

    if (engine.selection) {
      const { x0, y0, x1, y1 } = engine.selection;
      ctx.save();
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(
        x0 * pixelSize + 0.5,
        y0 * pixelSize + 0.5,
        (x1 - x0 + 1) * pixelSize - 1,
        (y1 - y0 + 1) * pixelSize - 1,
      );
      ctx.restore();
    }
  }, [engine, pixelSize, showGrid, hoverPixel]);

  useEffect(() => {
    redraw();
  });

  const toPixelCoords = (e: React.PointerEvent<HTMLCanvasElement>): PixelCoords => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / pixelSize),
      y: Math.floor((e.clientY - rect.top) / pixelSize),
    };
  };

  const isInsideCanvas = (p: PixelCoords) => p.x >= 0 && p.y >= 0 && p.x < engine.width && p.y < engine.height;

  const updateHover = (p: PixelCoords) => {
    if (!isInsideCanvas(p)) {
      setHoverPixel((prev) => (prev === null ? prev : null));
      return;
    }
    setHoverPixel((prev) => (prev && prev.x === p.x && prev.y === p.y ? prev : p));
  };

  return (
    <div
      className="relative outline outline-1 outline-line"
      style={{
        width: engine.width * pixelSize,
        height: engine.height * pixelSize,
        backgroundColor: "#ffffff",
        backgroundImage:
          "linear-gradient(45deg, #d9d9d9 25%, transparent 25%), linear-gradient(-45deg, #d9d9d9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d9d9d9 75%), linear-gradient(-45deg, transparent 75%, #d9d9d9 75%)",
        backgroundSize: "16px 16px",
        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
      }}
    >
      <canvas
        ref={displayRef}
        className="cursor-crosshair touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = toPixelCoords(e);
          engine.pointerDown(p.x, p.y);
        }}
        onPointerMove={(e) => {
          const p = toPixelCoords(e);
          updateHover(p);
          engine.pointerMove(p.x, p.y);
        }}
        onPointerUp={(e) => {
          const p = toPixelCoords(e);
          engine.pointerUp(p.x, p.y);
        }}
        onPointerLeave={() => setHoverPixel(null)}
        // Botao direito e usado pelo engine como ferramenta de desenho
        // (ex: apagar/cor secundaria) - sem isso, o menu nativo do
        // navegador/WebView interrompe o gesto de desenho.
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}

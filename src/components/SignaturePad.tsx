"use client";

// Touch / mouse signature capture. Stores a data URL + timestamp so it can be
// embedded in the PDF later. Redraws a saved signature after reload.

import { useEffect, useRef, useState } from "react";
import { Pen, X } from "./icons";

export interface SignatureValue {
  dataUrl: string;
  signedAt: string;
}

export function SignaturePad({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: SignatureValue | undefined) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const saved = value as SignatureValue | undefined;
  const [hasInk, setHasInk] = useState<boolean>(() => !!saved?.dataUrl);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#14181d";
    if (saved?.dataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = saved.dataUrl;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (canvas && hasInk) {
      onChange({ dataUrl: canvas.toDataURL("image/png"), signedAt: new Date().toISOString() });
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    setHasInk(false);
    onChange(undefined);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative overflow-hidden rounded-lg border border-line bg-paper">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-32 w-full touch-none"
          style={{ touchAction: "none" }}
        />
        {!hasInk ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-ink-faint">
            <Pen className="h-4 w-4" />
            <span className="text-sm">Sign here</span>
          </div>
        ) : null}
        <div className="pointer-events-none absolute bottom-2 left-3 right-3 border-b border-dashed border-line-strong" />
      </div>
      <div className="flex items-center justify-between">
        {saved?.signedAt ? (
          <span className="readout text-[11px] text-ink-faint">
            Signed {new Date(saved.signedAt).toLocaleString()}
          </span>
        ) : <span />}
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-notready"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}

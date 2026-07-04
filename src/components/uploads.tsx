"use client";

// Photo / video / document capture. Opens the device camera for photo & video
// fields. Previews are held for the session; the store keeps lightweight file
// metadata so completion + the checklist persist across reloads.

import { useEffect, useRef, useState } from "react";
import type { FieldDef } from "@/lib/types";
import { Camera, Video, Doc, X } from "./icons";

export interface Attachment {
  name: string;
  kind: "image" | "video" | "file";
}

const accept: Record<string, string> = {
  photo: "image/*",
  photos: "image/*",
  video: "video/*",
  file: "application/pdf,image/*",
};

export function UploadControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: Attachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const multiple = field.type === "photos";
  const attachments = Array.isArray(value) ? (value as Attachment[]) : [];
  // Session-only preview URLs, keyed by attachment name.
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kind: Attachment["kind"] =
    field.type === "video" ? "video" : field.type === "file" ? "file" : "image";

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files);
    const next = [...attachments];
    const nextPreviews = { ...previews };
    for (const f of picked) {
      const att: Attachment = { name: f.name || `capture-${next.length + 1}`, kind };
      nextPreviews[att.name] = URL.createObjectURL(f);
      if (multiple) next.push(att);
      else {
        next.length = 0;
        next.push(att);
      }
    }
    setPreviews(nextPreviews);
    onChange(multiple ? next : next.slice(-1));
  };

  const remove = (name: string) => {
    onChange(attachments.filter((a) => a.name !== name));
  };

  const Icon = field.type === "video" ? Video : field.type === "file" ? Doc : Camera;
  const label =
    field.type === "video" ? "Record / choose video" : field.type === "file" ? "Upload document" : attachments.length && multiple ? "Add another photo" : "Take / choose photo";
  const capture = field.type === "file" ? undefined : "environment";

  return (
    <div className="flex flex-col gap-2.5">
      <input
        ref={inputRef}
        type="file"
        accept={accept[field.type] ?? "*/*"}
        multiple={multiple}
        capture={capture}
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {attachments.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            <li key={a.name} className="group relative">
              <div className="flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border border-line bg-mist">
                {previews[a.name] && a.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[a.name]} alt={a.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 px-2 text-center text-ink-faint">
                    {a.kind === "video" ? <Video /> : a.kind === "file" ? <Doc /> : <Camera />}
                    <span className="line-clamp-2 text-[10px] leading-tight">{a.name}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                onClick={() => remove(a.name)}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-paper text-ink-soft shadow-sm hover:bg-notready-tint hover:text-notready"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-strong bg-mist px-4 text-sm font-semibold text-ink-soft transition-colors hover:border-bond hover:bg-bond/[0.04] hover:text-bond-deep"
      >
        <Icon className="h-5 w-5" />
        {label}
      </button>
    </div>
  );
}

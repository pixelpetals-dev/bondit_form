"use client";

// Maps a schema field to the right control and wires it to the store. Every
// concept renders fields through this, so behaviour is identical everywhere.

import type { FieldDef, GroupDef } from "@/lib/types";
import { useStore } from "@/lib/store";
import { isFieldVisible, visibleFields } from "@/lib/engine";
import {
  FieldShell,
  TextControl,
  NumberControl,
  SelectControl,
  MultiSelectControl,
  ToggleControl,
  CalcReadout,
  NotePanel,
} from "./controls";
import { UploadControl } from "./uploads";
import { SignaturePad } from "./SignaturePad";
import { ParapetRepeater, AdhesionRepeater } from "./repeaters";

export function FieldRenderer({ field }: { field: FieldDef }) {
  const { answers, set } = useStore();
  if (!isFieldVisible(field, answers)) return null;

  const value = answers[field.id];
  const onChange = (v: unknown) => set(field.id, v);

  switch (field.type) {
    case "note":
      return <NotePanel field={field} />;
    case "calc":
      return <CalcReadout field={field} output={field.compute!(answers)} />;
    case "text":
    case "textarea":
    case "email":
    case "tel":
    case "date":
    case "time":
      return (
        <FieldShell field={field}>
          <TextControl field={field} value={value} onChange={onChange} />
        </FieldShell>
      );
    case "number":
      return (
        <FieldShell field={field}>
          <NumberControl field={field} value={value} onChange={onChange} />
        </FieldShell>
      );
    case "select":
      return (
        <FieldShell field={field}>
          <SelectControl field={field} value={value} onChange={onChange} />
        </FieldShell>
      );
    case "multiselect":
      return (
        <FieldShell field={field}>
          <MultiSelectControl field={field} value={value} onChange={onChange} />
        </FieldShell>
      );
    case "toggle":
      return (
        <FieldShell field={field}>
          <ToggleControl value={value} onChange={onChange} />
        </FieldShell>
      );
    case "photo":
    case "photos":
    case "video":
    case "file":
      return (
        <FieldShell field={field}>
          <UploadControl field={field} value={value} onChange={onChange} />
        </FieldShell>
      );
    case "signature":
      return (
        <FieldShell field={field}>
          <SignaturePad value={value} onChange={onChange} />
        </FieldShell>
      );
    case "parapets":
      return (
        <FieldShell field={field}>
          <ParapetRepeater field={field} value={value} onChange={onChange} />
        </FieldShell>
      );
    case "adhesion":
      return (
        <FieldShell field={field}>
          <AdhesionRepeater field={field} value={value} onChange={onChange} />
        </FieldShell>
      );
    default:
      return null;
  }
}

/** A group's visible fields laid out on a responsive 2-col grid (span-aware). */
export function FieldGrid({ group }: { group: GroupDef }) {
  const { answers } = useStore();
  const fields = visibleFields(group, answers);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div
          key={f.id}
          id={`field-${f.id}`}
          className={`scroll-mt-28 ${f.span === 1 ? "sm:col-span-1" : "sm:col-span-2"}`}
        >
          <FieldRenderer field={f} />
        </div>
      ))}
    </div>
  );
}

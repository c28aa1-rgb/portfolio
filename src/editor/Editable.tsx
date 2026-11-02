import { useRef, type ElementType, type KeyboardEvent, type ReactNode } from "react";
import { T } from "../components/Text";
import { useContent } from "./store";

type Props = { path: string; as?: ElementType; className?: string; multiline?: boolean; placeholder?: string };

/** Text from content.json. In edit mode it becomes editable in place and saves on blur. */
export function E({ path, as: Tag = "span", className, multiline = false, placeholder = "Type here" }: Props) {
  const { get, set, editing } = useContent();
  const value = String(get(path) ?? "");
  const ref = useRef<HTMLElement>(null);

  if (!editing) return Tag === "span" && !className ? <T>{value}</T> : <Tag className={className}><T>{value}</T></Tag>;

  const commit = () => {
    const text = (ref.current?.innerText ?? "").replace(/ /g, " ").trim();
    if (text !== value) set(path, text);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === "Escape") {
      if (ref.current) ref.current.innerText = value;
      ref.current?.blur();
    }
  };
  return (
    <Tag
      ref={ref}
      className={`${className ?? ""} editable ${value.startsWith("TODO") || !value ? "is-todo" : ""}`}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      onBlur={commit}
      onKeyDown={onKeyDown}
      onClick={(e: React.MouseEvent) => e.preventDefault()}
    >
      {value}
    </Tag>
  );
}

/** Small add / remove / reorder buttons for list items. Render nothing outside edit mode. */
export function ItemTools({ path, index, count }: { path: string; index: number; count: number }) {
  const { editing, remove, move } = useContent();
  if (!editing) return null;
  return (
    <span className="item-tools" contentEditable={false}>
      <button type="button" onClick={() => move(path, index, -1)} disabled={index === 0} aria-label="Move up">
        ↑
      </button>
      <button type="button" onClick={() => move(path, index, 1)} disabled={index === count - 1} aria-label="Move down">
        ↓
      </button>
      <button type="button" onClick={() => confirm("Remove this item?") && remove(path, index)} aria-label="Remove">
        ×
      </button>
    </span>
  );
}

export function AddButton({ path, item, children }: { path: string; item: unknown; children: ReactNode }) {
  const { editing, add } = useContent();
  if (!editing) return null;
  return (
    <button type="button" className="add-button" onClick={() => add(path, structuredClone(item))}>
      + {children}
    </button>
  );
}

/** Lets you change where a link points. */
export function HrefButton({ path }: { path: string }) {
  const { editing, get, set } = useContent();
  if (!editing) return null;
  return (
    <button
      type="button"
      className="href-button"
      onClick={() => {
        const next = prompt("Link address", String(get(path) ?? ""));
        if (next !== null) set(path, next.trim());
      }}
    >
      URL
    </button>
  );
}

/** Upload or remove an image. Files are saved into public/media/uploads. */
export function UploadButton({ path, label = "Upload photo" }: { path: string; label?: string }) {
  const { editing, get, set } = useContent();
  const input = useRef<HTMLInputElement>(null);
  if (!editing) return null;
  const current = get(path) as string | null;
  const onFile = async (file: File) => {
    const res = await fetch(`/__upload?name=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
    if (!res.ok) return alert("Upload failed. Is `npm run dev` still running?");
    const { src } = await res.json();
    set(path, src);
  };
  return (
    <span className="upload" contentEditable={false}>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <button type="button" onClick={() => input.current?.click()}>
        {current ? "Replace photo" : label}
      </button>
      {current && (
        <button type="button" onClick={() => set(path, null)}>
          Remove
        </button>
      )}
    </span>
  );
}

/** Add or remove screenshots in a project's slideshow. */
export function GalleryTools({ path }: { path: string }) {
  const { editing, get, add, remove } = useContent();
  const input = useRef<HTMLInputElement>(null);
  if (!editing) return null;
  const images = (get(path) as string[]) ?? [];
  const onFile = async (file: File) => {
    const res = await fetch(`/__upload?name=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
    if (!res.ok) return alert("Upload failed. Is `npm run dev` still running?");
    add(path, (await res.json()).src);
  };
  return (
    <span className="upload" contentEditable={false}>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <button type="button" onClick={() => input.current?.click()}>
        Add screenshot
      </button>
      {images.map((src, i) => (
        <button key={src + i} type="button" title={src} onClick={() => confirm(`Remove screenshot ${i + 1}?`) && remove(path, i)}>
          × {i + 1}
        </button>
      ))}
    </span>
  );
}

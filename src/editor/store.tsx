import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialContent, type Content } from "../content";

// Editing only exists in `npm run dev`. The production build is a static site with no editor.
export const CAN_EDIT = import.meta.env.DEV;

type Status = "idle" | "saving" | "saved" | "error";
type Store = {
  content: Content;
  editing: boolean;
  setEditing: (on: boolean) => void;
  status: Status;
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  add: (path: string, item: unknown) => void;
  remove: (path: string, index: number) => void;
  move: (path: string, index: number, by: number) => void;
};

const Ctx = createContext<Store | null>(null);

const split = (path: string) => path.split(".").map((k) => (/^\d+$/.test(k) ? Number(k) : k));

export function getIn(obj: unknown, path: string): unknown {
  return split(path).reduce<unknown>((o, k) => (o == null ? o : (o as Record<string | number, unknown>)[k]), obj);
}

function setIn<T>(obj: T, keys: (string | number)[], value: unknown): T {
  if (!keys.length) return value as T;
  const [k, ...rest] = keys;
  const copy: any = Array.isArray(obj) ? [...obj] : { ...(obj as object) };
  copy[k] = setIn(copy[k], rest, value);
  return copy;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content>(initialContent);
  const [editing, setEditingState] = useState(() => CAN_EDIT && sessionStorageGet("editing") === "1");
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<number>(undefined);
  const latest = useRef(content);

  const save = useCallback((next: Content) => {
    latest.current = next;
    setStatus("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch("/__content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(latest.current, null, 2) });
        setStatus(res.ok ? "saved" : "error");
      } catch {
        setStatus("error");
      }
    }, 400);
  }, []);

  const update = useCallback(
    (fn: (c: Content) => Content) =>
      setContent((c) => {
        const next = fn(c);
        save(next);
        return next;
      }),
    [save],
  );

  const set = useCallback((path: string, value: unknown) => update((c) => setIn(c, split(path), value)), [update]);
  const add = useCallback((path: string, item: unknown) => update((c) => setIn(c, split(path), [...((getIn(c, path) as unknown[]) ?? []), item])), [update]);
  const remove = useCallback((path: string, i: number) => update((c) => setIn(c, split(path), (getIn(c, path) as unknown[]).filter((_, j) => j !== i))), [update]);
  const move = useCallback(
    (path: string, i: number, by: number) =>
      update((c) => {
        const list = [...(getIn(c, path) as unknown[])];
        const j = i + by;
        if (j < 0 || j >= list.length) return c;
        [list[i], list[j]] = [list[j], list[i]];
        return setIn(c, split(path), list);
      }),
    [update],
  );

  const setEditing = (on: boolean) => {
    setEditingState(on);
    sessionStorageSet("editing", on ? "1" : "0");
    document.documentElement.classList.toggle("is-editing", on);
  };
  useEffect(() => {
    document.documentElement.classList.toggle("is-editing", editing);
  }, [editing]);

  const get = useCallback((path: string) => getIn(content, path), [content]);

  return <Ctx.Provider value={{ content, editing, setEditing, status, get, set, add, remove, move }}>{children}</Ctx.Provider>;
}

export function useContent() {
  const store = useContext(Ctx);
  if (!store) throw new Error("useContent must be used inside ContentProvider");
  return store;
}

function sessionStorageGet(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function sessionStorageSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* private mode: editing just won't persist across reloads */
  }
}

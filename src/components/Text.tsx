// Renders content strings. Strings that start with "TODO:" become visible placeholders.
export const isTodo = (s: string | null | undefined) => !s || s.startsWith("TODO");

export function T({ children }: { children: string }) {
  if (!isTodo(children)) return <>{children}</>;
  const hint = children.replace(/^TODO:?\s*/, "") || "Fill in";
  return (
    <span className="todo" title="Edit this in src/content.ts">
      {hint}
    </span>
  );
}

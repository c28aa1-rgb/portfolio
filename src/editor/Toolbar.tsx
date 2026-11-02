import { CAN_EDIT, useContent } from "./store";

const label = { idle: "", saving: "Saving…", saved: "Saved to content.json", error: "Couldn't save. Is npm run dev running?" };

export function Toolbar() {
  const { editing, setEditing, status } = useContent();
  if (!CAN_EDIT) return null;
  return (
    <div className={`toolbar ${editing ? "is-on" : ""}`} role="region" aria-label="Page editor">
      {editing && <span className={`toolbar__status is-${status}`}>{label[status] || "Click any text to edit it"}</span>}
      <button type="button" className="toolbar__toggle" onClick={() => setEditing(!editing)}>
        {editing ? "Done" : "Edit page"}
      </button>
    </div>
  );
}

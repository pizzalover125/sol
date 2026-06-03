export const FIELD_TYPES = [
  { value: "text", label: "Short Text", icon: "—" },
  { value: "textarea", label: "Long Text", icon: "¶" },
  { value: "email", label: "Email", icon: "@" },
  { value: "phone", label: "Phone", icon: "☎" },
  { value: "number", label: "Number", icon: "#" },
  { value: "date", label: "Date", icon: "▦" },
  { value: "select", label: "Dropdown", icon: "▾", choice: true },
  { value: "radio", label: "Multiple Choice", icon: "◉", choice: true },
  {
    value: "checkboxes",
    label: "Checkboxes",
    icon: "☑",
    choice: true,
    multi: true,
  },
  { value: "checkbox", label: "Single Checkbox", icon: "✓", bool: true },
];

export function fieldMeta(type) {
  return FIELD_TYPES.find((t) => t.value === type) ?? FIELD_TYPES[0];
}

export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "q" + Math.random().toString(36).slice(2, 10);
}

export function blankQuestion(type = "text") {
  const meta = fieldMeta(type);
  const q = {
    id: newId(),
    type: meta.value,
    label: "",
    required: false,
    help: "",
  };
  if (meta.choice) q.options = ["Option 1", "Option 2"];
  return q;
}

export function normalizeQuestions(raw) {
  let arr;
  try {
    arr = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, 50)
    .map((q) => {
      const meta = fieldMeta(q?.type);
      const out = {
        id: String(q?.id ?? newId()),
        type: meta.value,
        label: String(q?.label ?? "").slice(0, 200),
        required: !!q?.required,
      };
      const help = String(q?.help ?? "").slice(0, 300);
      if (help.trim()) out.help = help;
      if (meta.choice) {
        out.options = (Array.isArray(q?.options) ? q.options : [])
          .map((o) => String(o).slice(0, 120))
          .filter((o) => o.trim() !== "")
          .slice(0, 30);
        if (out.options.length === 0) out.options = ["Option 1"];
      }
      return out;
    })
    .filter((q) => q.label.trim() !== "");
}

export function collectAnswers(questions, form) {
  const answers = {};
  for (const q of questions ?? []) {
    const key = `q_${q.id}`;
    const meta = fieldMeta(q.type);
    let value;
    if (meta.multi) {
      value = form
        .getAll(key)
        .map((v) => v.toString())
        .filter((v) => v !== "");
    } else if (meta.bool) {
      value = form.get(key) != null;
    } else {
      value = (form.get(key) ?? "").toString().trim();
    }

    const empty = meta.multi
      ? value.length === 0
      : meta.bool
        ? value === false
        : value === "";

    if (q.required && empty) {
      return { error: `"${q.label || "Question"}" is required` };
    }

    if (meta.bool) {
      answers[q.id] = value;
    } else if (!empty) {
      answers[q.id] = value;
    }
  }
  return { answers };
}

export function formatAnswer(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === true) return "Yes";
  if (value === false) return "No";
  return String(value ?? "");
}

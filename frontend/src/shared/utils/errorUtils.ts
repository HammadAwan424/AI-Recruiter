/**
 * Centralized API error formatter that safely handles:
 * 1. String errors ("Email already registered")
 * 2. FastAPI validation error arrays ([{ loc: [...], msg: "...", type: "..." }])
 * 3. Structured error objects ({ detail: "...", message: "..." })
 * 4. Network / Generic exceptions
 *
 * Always returns a clean, safe, human-readable string suitable for React rendering.
 */
export function formatApiError(err: any, fallbackMessage: string = "An unexpected error occurred"): string {
  if (!err) return fallbackMessage;

  const detail = err?.data?.detail ?? err?.detail ?? err?.data?.message ?? err?.message;

  if (typeof detail === "string") {
    return detail.trim() || fallbackMessage;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const locArr = Array.isArray(item.loc) ? item.loc : [];
          const field = locArr.length > 0 ? String(locArr[locArr.length - 1]) : "";
          const msg = item.msg || item.message || JSON.stringify(item);
          if (field && field !== "body") {
            // Capitalize field name
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
            return `${fieldName}: ${msg}`;
          }
          return msg;
        }
        return String(item);
      })
      .filter(Boolean);

    return messages.length > 0 ? messages.join(". ") : fallbackMessage;
  }

  if (typeof detail === "object" && detail !== null) {
    if (typeof detail.msg === "string") return detail.msg;
    if (typeof detail.message === "string") return detail.message;
    if (typeof detail.error === "string") return detail.error;
    try {
      return JSON.stringify(detail);
    } catch {
      return fallbackMessage;
    }
  }

  return String(err?.statusText || fallbackMessage);
}

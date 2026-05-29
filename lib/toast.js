export function showSuccessToast(message) {
  if (typeof window === "undefined" || !message) return;

  window.dispatchEvent(
    new CustomEvent("myboard:toast", {
      detail: { type: "success", message },
    })
  );
}

export function showErrorToast(message) {
  if (typeof window === "undefined" || !message) return;

  window.dispatchEvent(
    new CustomEvent("myboard:toast", {
      detail: { type: "error", message },
    })
  );
}

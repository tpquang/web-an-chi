import { useRef, useState } from "react";
import { showToast } from "../components/ui/Toast";
import { errorMessage, fieldErrors } from "./api";

// Khoá form trong lúc gửi, chặn gửi lần hai bằng ref, mở khoá trong finally
export function useSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inFlight = useRef(false);

  async function run(action: () => Promise<void>, failTitle: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setErrors({});
    try {
      await action();
    } catch (err) {
      const found = fieldErrors(err);
      setErrors(found);
      showToast(failTitle, { type: "error", desc: Object.keys(found).length ? "Bạn sửa các ô được đánh dấu đỏ rồi lưu lại." : errorMessage(err) });
      const first = Object.keys(found)[0];
      if (first) document.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] textarea, [data-field="${first}"] button`)?.focus();
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return { submitting, errors, setErrors, run };
}

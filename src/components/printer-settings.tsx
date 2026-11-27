import { Printer } from "lucide-react";
import { useState } from "react";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { SettingsTitle } from "./settings-title";
import { useWorkspace } from "./workspace-provider";
import styles from "./settings-surface.module.css";

export function PrinterSettings() {
  const { paper } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [saved, setSaved] = useState(false);

  return <section className={styles.card} id="printer-settings" aria-labelledby="printer-settings-title">
    <SettingsTitle
      id="printer-settings-title"
      title="Receipt printing"
      icon={Printer}
      description="Add your printer in your device settings, then select it in the browser’s print dialog when you print a receipt."
    />
    <label className="workspace-field mt-4 max-w-56">Receipt width
      <select value={paper} disabled={mutation.pending} onChange={(event) => {
        setSaved(false);
        void mutation.run({ kind: "paper", width: event.target.value === "80" ? 80 : 58 }, () => setSaved(true));
      }}>
        <option value="58">58 mm</option>
        <option value="80">80 mm</option>
      </select>
    </label>
    {mutation.error && <p className={styles.feedback} data-error role="alert">{mutation.error}</p>}
    {saved && <p className={styles.feedback} role="status">Receipt width saved.</p>}
  </section>;
}

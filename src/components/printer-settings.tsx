import { Printer } from "lucide-react";
import { SettingsTitle } from "./settings-title";
import styles from "./settings-surface.module.css";

export function PrinterSettings() {
  return <section className={styles.card} id="printer-settings" aria-labelledby="printer-settings-title">
    <SettingsTitle
      id="printer-settings-title"
      title="Receipt printing"
      icon={Printer}
      description="Add your printer in your device settings, then select it in the browser’s print dialog when you print a receipt."
    />
  </section>;
}

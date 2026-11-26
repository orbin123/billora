import type { LucideIcon } from "lucide-react";
import styles from "./settings-surface.module.css";

export function SettingsTitle({ title, id, icon: Icon, description }: {
  title: string; id: string; icon: LucideIcon; description?: string;
}) {
  return <div className={styles.heading}>
    <span className={styles.headingIcon}><Icon aria-hidden="true" /></span>
    <div><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div>
  </div>;
}

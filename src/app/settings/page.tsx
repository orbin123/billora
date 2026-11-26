"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Building2, Menu, Printer, ShieldCheck } from "lucide-react";
import { InstallApp } from "@/components/install-app";
import { PrinterSettings } from "@/components/printer-settings";
import { RoleSettings } from "@/components/role-settings";
import { WorkspaceNavigation, WorkspaceProfile } from "@/components/workspace-navigation";
import { BusinessSettings } from "@/components/business-settings";
import common from "../categories/categories.module.css";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return <div className={common.shell}>
    <WorkspaceNavigation styles={common} current="/settings" open={menuOpen} onClose={closeMenu} />
    <main className={common.main}>
      <header className={common.topbar}>
        <div className={common.pageIntro}>
          <button className={common.menuButton} type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div><p>Workspace preferences</p><h1>Settings</h1></div>
        </div>
        <WorkspaceProfile styles={common} />
      </header>
      <div className={`${common.content} ${styles.content}`}>
        <nav className={styles.jumpLinks} aria-label="Settings sections">
          <Link href="#business-settings"><Building2 aria-hidden="true" /> Business information</Link>
          <Link href="#printer-settings"><Printer aria-hidden="true" /> Printer settings</Link>
          <Link href="#roles-settings"><ShieldCheck aria-hidden="true" /> Roles &amp; permissions</Link>
        </nav>
        <div className={styles.grid}>
          <BusinessSettings />
          <PrinterSettings />
          <RoleSettings />
          <InstallApp />
        </div>
      </div>
    </main>
  </div>;
}

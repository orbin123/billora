"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsTitle } from "./settings-title";
import styles from "./settings-surface.module.css";

type InstallEvent = Event & { prompt: () => Promise<unknown> };

const InstallContext = createContext<{ prompt: InstallEvent | null; standalone: boolean; clearPrompt: () => void }>({ prompt: null, standalone: false, clearPrompt: () => {} });

export function AppInstallProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const syncDisplay = () => setStandalone(display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const installed = () => { setStandalone(true); setPrompt(null); };
    syncDisplay();
    display.addEventListener("change", syncDisplay);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      display.removeEventListener("change", syncDisplay);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  return <InstallContext.Provider value={{ prompt, standalone, clearPrompt: () => setPrompt(null) }}>{children}</InstallContext.Provider>;
}

export function InstallApp() {
  const { prompt, standalone, clearPrompt } = useContext(InstallContext);

  const description = standalone ? "Billora is running as an installed app."
    : prompt ? undefined : "Use your browser’s Install app or Add to Home Screen option when available.";

  return <section className={styles.card} aria-labelledby="install-title">
    <SettingsTitle id="install-title" title="Install Billora" icon={Smartphone} description={description} />
    {!standalone && prompt && <Button className={styles.installAction} onClick={async () => {
      clearPrompt();
      try { await prompt.prompt(); } catch { /* Show the browser menu guidance. */ }
    }}><Download size={16} aria-hidden="true" /> Install app</Button>}
  </section>;
}

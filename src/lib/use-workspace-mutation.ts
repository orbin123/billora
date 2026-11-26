"use client";

import { useRef, useState } from "react";
import { useWorkspace } from "@/components/workspace-provider";
import type { Bill } from "@/data/workspace";
import type { WorkspaceAction } from "./workspace-commands";

export function useWorkspaceMutation() {
  const { perform } = useWorkspace();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  async function run(action: WorkspaceAction, onSuccess?: (bill?: Bill) => void) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      const bill = await perform(action);
      onSuccess?.(bill);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn’t save this change.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return { run, pending, error, clearError: () => setError("") };
}

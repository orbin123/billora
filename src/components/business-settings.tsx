"use client";

import { useState, type FormEvent } from "react";
import { Building2 } from "lucide-react";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { currencies, timeZones, type BusinessProfile } from "@/data/business-profile";
import { Button } from "./ui/button";
import { useWorkspace } from "./workspace-provider";
import { SettingsTitle } from "./settings-title";
import styles from "./settings-surface.module.css";

export function BusinessSettings() {
  const { business } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [saved, setSaved] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "").trim();
    void mutation.run({ kind: "business", business: {
      name: field("name"), addressLines: field("address").split("\n").map((line) => line.trim()).filter(Boolean),
      gstin: field("gstin"), phone: field("phone"), fssaiLicense: field("license"),
      timeZone: field("timeZone") as BusinessProfile["timeZone"], currency: field("currency") as BusinessProfile["currency"],
      gstComponentRate: Number(field("rate")),
    } }, () => setSaved(true));
  }

  return <section className={styles.card} id="business-settings" aria-labelledby="business-title">
    <SettingsTitle id="business-title" title="Business information" icon={Building2} />
    <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={save}>
      <label className="workspace-field">Business name<input name="name" defaultValue={business.name} maxLength={80} required /></label>
      <label className="workspace-field">Phone<input name="phone" type="tel" defaultValue={business.phone} maxLength={35} /></label>
      <label className="workspace-field sm:col-span-2">Receipt address
        <textarea className="rounded-xl border border-[#dce5e0] p-3" name="address" defaultValue={business.addressLines.join("\n")} rows={3} maxLength={600} />
      </label>
      <label className="workspace-field">GSTIN<input name="gstin" defaultValue={business.gstin} maxLength={30} /></label>
      <label className="workspace-field">FSSAI licence<input name="license" defaultValue={business.fssaiLicense} maxLength={30} /></label>
      <label className="workspace-field">Currency<select name="currency" defaultValue={business.currency}>{currencies.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="workspace-field">Time zone<select name="timeZone" defaultValue={business.timeZone}>{timeZones.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="workspace-field">GST per component (%)<input name="rate" type="number" min="0" max="50" step="0.01" defaultValue={business.gstComponentRate} required /></label>
      <div className="flex flex-wrap items-end justify-end gap-2 sm:col-span-2">
        {mutation.error && <p role="alert" className="text-sm text-rose-800">{mutation.error}</p>}
        {saved && <p role="status" className="text-sm text-emerald-800">Business settings saved.</p>}
        <Button disabled={mutation.pending}>Save business settings</Button>
      </div>
    </form>
  </section>;
}

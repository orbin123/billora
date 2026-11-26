"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronDown, ImagePlus } from "lucide-react";
import { useWorkspace } from "@/components/workspace-provider";
import type { Food } from "@/data/workspace";
import styles from "./new-food.module.css";

export function FoodForm({ food, onSave, cancel }: {
  food?: Food; onSave: (food: Food) => Promise<void>; cancel: ReactNode;
}) {
  const { categories, allows, owner, business } = useWorkspace();
  const [image, setImage] = useState(food?.image);
  const [imageName, setImageName] = useState("");
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setImageError("Choose a PNG, JPG, or WEBP image up to 2 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    setReading(true);
    reader.onload = () => {
      setImage(String(reader.result));
      setImageName(file.name);
    };
    reader.onerror = () => setImageError("Could not open that image. Choose another file.");
    reader.onloadend = () => setReading(false);
    reader.readAsDataURL(file);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reading || saving) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const categoryId = Number(data.get("category"));
    const price = Number(data.get("price"));
    const quantity = Number(data.get("quantity"));
    if (!name || !categories.some(({ id }) => id === categoryId) || !Number.isFinite(price) || price <= 0 || !Number.isSafeInteger(quantity) || quantity < 0) {
      setError("Enter a name, category, valid price, and whole-number quantity.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
      id: food?.id ?? 0, name, categoryId, price: Math.round(price * 100) / 100, quantity, image: image?.startsWith("data:") ? image : undefined, version: food?.version,
      status: data.get("status") === "Unavailable" ? "Unavailable" : "Available",
      emoji: food?.emoji ?? "🍽️", tone: food?.tone ?? "rice",
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn’t save this food.");
    } finally {
      setSaving(false);
    }
  }

  return <form className={styles.form} onSubmit={save}>
    <div className={styles.fields}>
      <label>Food name<input required name="name" maxLength={80} defaultValue={food?.name} placeholder="Enter food name" /></label>
      <label>Category<span className={styles.selectWrap}>
        <select required name="category" defaultValue={food?.categoryId ?? ""}>
          <option value="" disabled>Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select><ChevronDown aria-hidden="true" />
      </span></label>
      {!categories.length && <p className="text-sm text-[var(--muted)]">Add a category before saving a food. {owner && <Link href="/categories" className="font-semibold underline">Go to categories</Link>}</p>}
      <label>Price ({business.currency})<span className={styles.priceWrap}><input required name="price" type="number" inputMode="decimal" min="0.01" max="999999.99" step="0.01" defaultValue={food?.price} placeholder="Enter price" /></span></label>
      <label>Quantity<input name="quantity" required type="number" inputMode="numeric" min="0" max="999999" step="1" defaultValue={food?.quantity ?? 0} /></label>
      <label>Status<span className={styles.selectWrap}><select name="status" defaultValue={food?.status ?? "Available"}><option>Available</option><option>Unavailable</option></select><ChevronDown aria-hidden="true" /></span></label>
    </div>
    {allows("Upload product images") && <div className={styles.imageColumn}>
      <span className={styles.imageLabel}>Food image</span>
      <label className={styles.uploadBox}>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectImage} disabled={reading} aria-label="Food image" />
        {/* eslint-disable-next-line @next/next/no-img-element -- Local file preview. */}
        {image ? <img src={image} alt="Selected food preview" /> : <span className={styles.uploadIcon}><ImagePlus /></span>}
        <strong>{reading ? "Opening image…" : imageName || (image ? "Replace image" : "Choose image")}</strong>
        <small>PNG, JPG, or WEBP up to 2 MB</small>
      </label>
      {imageError && <p className="text-sm text-rose-800" role="alert">{imageError}</p>}
    </div>
    }
    {error && <p role="alert" className="col-span-full text-sm text-rose-800">{error}</p>}
    <footer className={styles.actions}>{cancel}<button className={styles.saveButton} type="submit" disabled={reading || saving || !categories.length}><Check /> {saving ? "Saving food…" : "Save food"}</button></footer>
  </form>;
}

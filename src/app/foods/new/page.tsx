"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, ImagePlus, IndianRupee, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import styles from "./new-food.module.css";

export default function NewFoodPage() {
  const [imageName, setImageName] = useState("");
  const [saved, setSaved] = useState(false);
  const selectImage = (event: ChangeEvent<HTMLInputElement>) => setImageName(event.target.files?.[0]?.name ?? "");
  const saveFood = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaved(true); };

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/foods" className={styles.backLink}><ArrowLeft /> Back to foods</Link><div className={styles.brand}><BrandMark className={styles.brandMark} size="header" /><strong>BILLORA</strong></div><span className={styles.demoBadge}>Demo data</span></header>
    <section className={styles.workspace}><div className={styles.title}><p>Menu management</p><h1>Add new food</h1><span>Create a menu item your team can use at the counter.</span></div>
      <form className={styles.form} onSubmit={saveFood}><div className={styles.imageColumn}><label className={styles.imageLabel}>Food image</label><label className={styles.uploadBox}><input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectImage} /><span className={styles.uploadIcon}><ImagePlus /></span><strong>{imageName || "Upload image"}</strong><small>{imageName ? "Image selected for this demo" : "PNG, JPG, or WEBP up to 2MB"}</small></label></div>
        <div className={styles.fields}><label>Food name<input required placeholder="Enter food name" /></label><label>Category<span className={styles.selectWrap}><select defaultValue=""><option value="" disabled>Select category</option><option>Rice & meals</option><option>Curries</option><option>Fish & seafood</option><option>Breads & sides</option><option>Beverages</option></select><ChevronDown /></span></label><label>Price (₹)<span className={styles.priceWrap}><IndianRupee /><input required inputMode="decimal" placeholder="Enter price" /></span></label><label>Status<span className={styles.selectWrap}><select defaultValue="Available"><option>Available</option><option>Unavailable</option></select><ChevronDown /></span></label></div>
        <footer className={styles.actions}><Link className={styles.cancelButton} href="/foods">Cancel</Link><button className={styles.saveButton} type="submit"><Check /> Save food</button></footer></form>
      {saved && <div className={styles.toast} role="status"><Check /> Food saved to this demo view.<Link href="/foods">Return to foods</Link><button type="button" onClick={() => setSaved(false)} aria-label="Dismiss"><X /></button></div>}
    </section>
  </main>;
}

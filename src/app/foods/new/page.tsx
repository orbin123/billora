"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { useWorkspace } from "@/components/workspace-provider";
import { FoodForm } from "./food-form";
import styles from "./new-food.module.css";

export default function NewFoodPage() {
  const { perform } = useWorkspace();
  const [saved, setSaved] = useState("");

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/foods" className={styles.backLink}><ArrowLeft /> Back to foods</Link>
      <div className={styles.brand}><BrandMark className={styles.brandMark} size="header" /><strong>BILLORA</strong></div>
      <span aria-hidden="true" />
    </header>
    <section className={styles.workspace}>
      <div className={styles.title}><h1>Add new food</h1></div>
      {saved ? <p className={styles.toast} role="status"><Check /> {saved} was added.<Link href="/foods">Back to foods</Link></p> : <FoodForm
        cancel={<Link className={styles.cancelButton} href="/foods">Cancel</Link>}
        onSave={async (food) => { await perform({ kind: "save-food", food }); setSaved(food.name); }}
      />}
    </section>
  </main>;
}

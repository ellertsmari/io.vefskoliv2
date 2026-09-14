"use client";
import { useState } from "react";
import type { ActivityCycle } from "types/activityLogTypes";
import { saveActivityCycle } from "serverActions/activityLog";
import styles from "./ActivityLog.module.css";

export function ActivityCycleForm({ guideId, cycle, onSaved, onCancel }: { guideId: string; cycle?: ActivityCycle; onSaved: () => Promise<void>; onCancel: () => void }) {
  const [label, setLabel] = useState(cycle?.label ?? "");
  const [cap, setCap] = useState((cycle?.activityCapMinutes ?? 600) / 60);
  const [periods, setPeriods] = useState(cycle?.periods ?? [
    { id: "autumn", label: "Autumn", startDate: "", endDate: "", targetMinutes: 900 },
    { id: "spring", label: "Spring", startDate: "", endDate: "", targetMinutes: 900 },
  ]);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  return <form className={styles.form} onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await saveActivityCycle(guideId, { label, periods, activityCapMinutes: Math.round(cap * 60) }, cycle?.id);
      if (result.success) await onSaved(); else setError(result.message);
    } catch { setError("Could not save. Please try again."); }
    finally { setBusy(false); }
  }}>
    <h2>{cycle ? "Reporting year settings" : "Set up a reporting year"}</h2>
    <p className={styles.muted}>Extra approved hours carry forward to the next semester. Dates and targets are locked after the first activity is added.</p>
    {error && <p className={`${styles.notice} ${styles.error}`} role="alert">{error}</p>}
    <fieldset disabled={busy} style={{ display: "contents" }}>
      <div className={styles.fields}>
        <label>Reporting year<input required maxLength={100} value={label} placeholder="e.g. 2026–2027" onChange={(e) => setLabel(e.target.value)} /></label>
        <label>Maximum credited hours per activity<input type="number" min={1} max={1000} step={.25} required value={cap} onChange={(e) => setCap(Number(e.target.value))} /></label>
      </div>
      {periods.map((period, i) => <fieldset key={period.id}><legend>Semester {i + 1}</legend><div className={styles.fields}>
        <label>Name<input required value={period.label} onChange={(e) => setPeriods(periods.map((p, n) => n === i ? { ...p, label: e.target.value } : p))} /></label>
        <label>Required hours<input required type="number" min={1} max={1000} step={.25} value={period.targetMinutes / 60} onChange={(e) => setPeriods(periods.map((p, n) => n === i ? { ...p, targetMinutes: Math.round(Number(e.target.value) * 60) } : p))} /></label>
        <label>First activity date<input required type="date" value={period.startDate} onChange={(e) => setPeriods(periods.map((p, n) => n === i ? { ...p, startDate: e.target.value } : p))} /></label>
        <label>Last activity date<input required type="date" value={period.endDate} onChange={(e) => setPeriods(periods.map((p, n) => n === i ? { ...p, endDate: e.target.value } : p))} /></label>
      </div></fieldset>)}
      <div className={styles.actions}><button type="submit" className={styles.primary}>{busy ? "Saving…" : "Save reporting year"}</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </fieldset>
  </form>;
}

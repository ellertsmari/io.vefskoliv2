"use client";
import { useState } from "react";
import type { ActivityCycle, ActivityEntry, ActivityEntryInput } from "types/activityLogTypes";
import { formatActivityTime as time } from "utils/activityLog";
import type { ActionResult } from "utils/errors";
import styles from "./ActivityLog.module.css";

export async function prepareActivityImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Choose a JPG, PNG or WebP image under 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new window.Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("Could not read that image.")); img.src = url; });
    for (const size of [1400, 1000, 700]) {
      const scale = Math.min(1, size / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Image processing is unavailable. Try another browser.");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", .75);
      if (data.length <= 530000) return data;
    }
    throw new Error("That image is too detailed. Try a smaller image.");
  } finally { URL.revokeObjectURL(url); }
}

export function ActivityForm({ cycle, entry, onSave, onCancel }: {
  cycle: ActivityCycle; entry?: ActivityEntry;
  onSave: (input: ActivityEntryInput) => Promise<ActionResult<void>>; onCancel: () => void;
}) {
  const [name, setName] = useState(entry?.name ?? "");
  const [location, setLocation] = useState(entry?.location ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [sessions, setSessions] = useState(entry?.sessions ?? [{ date: "", minutes: 60 }]);
  const [links, setLinks] = useState(entry?.links.join("\n") ?? "");
  const [images, setImages] = useState<{ id?: string; data?: string }[]>(entry?.imageIds.map((id) => ({ id })) ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const patchSession = (index: number, patch: Partial<typeof sessions[number]>) => setSessions((list) => list.map((s, i) => i === index ? { ...s, ...patch } : s));
  const save = async (status: "draft" | "pending") => {
    setBusy(true); setError("");
    try {
      const result = await onSave({ id: entry?.id, revision: entry?.revision, guideId: cycle.guideId, cycleId: cycle.id, name, location, description, sessions, links: links.split("\n").map((s) => s.trim()).filter(Boolean), images, status });
      if (!result.success) setError(result.message);
    } catch { setError("Could not save. Your form is still here; please try again."); }
    finally { setBusy(false); }
  };
  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void save("pending"); }}>
    <h2>{entry ? "Edit activity" : "Add activity"}</h2>
    {entry?.status === "approved" && <p className={styles.notice}>Saving changes sends this activity for approval again. Its credit will be updated after review.</p>}
    {error && <p role="alert" className={`${styles.notice} ${styles.error}`}>{error}</p>}
    <fieldset disabled={busy} style={{ display: "contents" }}>
      <div className={styles.fields}>
        <label>Activity or event name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={160} placeholder="e.g. Reykjavík web meetup" /></label>
        <label>Location<input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} placeholder="Venue, city, or Online" /></label>
      </div>
      <fieldset><legend>When did you take part?</legend>
        {sessions.map((session, i) => <div className={styles.session} key={i}>
          <label>Date<input aria-label={`Date ${i + 1}`} type="date" required value={session.date} min={cycle.periods[0].startDate} max={cycle.periods[cycle.periods.length - 1].endDate < new Date().toISOString().slice(0, 10) ? cycle.periods[cycle.periods.length - 1].endDate : new Date().toISOString().slice(0, 10)} onChange={(e) => patchSession(i, { date: e.target.value })} /></label>
          <label>Hours<input aria-label={`Hours ${i + 1}`} type="number" min={0} max={24} step={1} value={Math.floor(session.minutes / 60)} onChange={(e) => patchSession(i, { minutes: (Number(e.target.value) || 0) * 60 + session.minutes % 60 })} /></label>
          <label>Minutes<input aria-label={`Minutes ${i + 1}`} type="number" min={0} max={59} step={1} value={session.minutes % 60} onChange={(e) => patchSession(i, { minutes: Math.floor(session.minutes / 60) * 60 + (Number(e.target.value) || 0) })} /></label>
          {sessions.length > 1 && <button type="button" aria-label={`Remove date ${i + 1}`} onClick={() => setSessions(sessions.filter((_, index) => index !== i))}>Remove</button>}
        </div>)}
        <button type="button" disabled={sessions.length >= 50} onClick={() => setSessions([...sessions, { date: "", minutes: 60 }])}>Add another date</button>
        <p className={styles.muted} style={{ marginTop: 8 }}>{time(total)} recorded · up to {time(Math.min(total, cycle.activityCapMinutes))} can count. Maximum {time(cycle.activityCapMinutes)} per activity, across all dates.</p>
      </fieldset>
      <label>What did you do and learn?<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={5000} placeholder="Briefly describe your participation and what you took away." /></label>
      <div>
        <label>Images <small>One or two images. Visible to you and your teachers.</small>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={images.length >= 2} onChange={async (e) => {
            const files = Array.from(e.target.files ?? []); e.target.value = "";
            if (images.length + files.length > 2) { setError("Choose up to two images in total."); return; }
            setBusy(true); setError("");
            try { const prepared = await Promise.all(files.map(prepareActivityImage)); setImages((current) => [...current, ...prepared.map((data) => ({ data }))]); }
            catch (err) { setError(err instanceof Error ? err.message : "Could not read that image."); }
            finally { setBusy(false); }
          }} />
        </label>
        <div className={styles.images}>{images.map((image, i) => <figure key={image.id ?? i}>
          {/* Private images must bypass a shared image-optimisation cache. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.data ?? `/api/activity-images/${entry?.id}/${image.id}`} alt={`Activity evidence ${i + 1}`} />
          <button type="button" onClick={() => setImages(images.filter((_, index) => index !== i))}>Remove image {i + 1}</button>
        </figure>)}</div>
      </div>
      <label>Supporting links <small>Optional · one https:// link per line, up to five.</small><textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2} /></label>
      <div className={styles.actions}>
        <button className={styles.primary} type="submit" name="intent" value="pending">{busy ? "Saving…" : "Send for approval"}</button>
        <button type="button" onClick={() => save("draft")}>Save draft</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </fieldset>
  </form>;
}

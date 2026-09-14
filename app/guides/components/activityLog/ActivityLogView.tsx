"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarkdownReader from "UIcomponents/markdown/reader";
import type { ActivityEntry, ActivityLogData, ActivityStudent } from "types/activityLogTypes";
import type { ClientGuide } from "types/guideTypes";
import { collectMaterials } from "../guideOverview/materials";
import type { ActionResult } from "utils/errors";
import { activityCsvCell, formatActivityTime as time } from "utils/activityLog";
import { deleteActivityEntry, getActivityLog, reviewActivityEntries, saveActivityEntry } from "serverActions/activityLog";
import { ActivityProgress } from "./ActivityProgress";
import { ActivityForm } from "./ActivityForm";
import { ActivityCycleForm } from "./ActivityCycleForm";
import styles from "./ActivityLog.module.css";

const statusLabel = { draft: "Draft", pending: "Awaiting approval", approved: "Approved", changesRequested: "Changes requested" };

export function ActivityLogView({ guideId, title, description, initial, guideDetails }: { guideId: string; title: string; description: string; initial: ActionResult<ActivityLogData>; guideDetails?: ClientGuide }) {
  const router = useRouter();
  const [data, setData] = useState(initial.success ? initial.data : null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(initial.success ? null : { text: initial.message, error: true });
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ActivityEntry | "new" | null>(null);
  const [settings, setSettings] = useState<"new" | "edit" | null>(null);
  const [studentId, setStudentId] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const cycle = data?.cycle;
  const student = data?.teacher ? data.students.find((s) => s.id === studentId) : data?.students[0];

  const reload = async (selected?: string) => {
    const result = await getActivityLog(guideId, selected);
    if (result.success) setData(result.data);
    else { setMessage({ text: result.message, error: true }); throw new Error(result.message); }
  };
  const mutate = async (action: () => Promise<ActionResult<void>>) => {
    setBusy(true); setMessage(null);
    try {
      const result = await action();
      setMessage({ text: result.message ?? "Saved.", error: !result.success });
      await reload(cycle?.id); router.refresh();
      return result;
    } catch { const result = { success: false as const, message: "Could not refresh the activity log. Reload before making another change." }; setMessage({ text: result.message, error: true }); return result; }
    finally { setBusy(false); }
  };
  const openForm = (entry: ActivityEntry | "new") => { setEditing(entry); requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); };

  return <main className={styles.page} aria-busy={busy}>
    <header className={styles.header}>
      <div><Link href="/guides" className={styles.eyebrow}>← All guides</Link><h1>{title}</h1><p className={styles.muted}>Activity log{data?.teacher ? " · Teacher overview" : ""}</p></div>
      {data?.teacher && <Link className={styles.button} href={`/LMS/edit-guides/${guideId}`}>Edit guide</Link>}
    </header>
    {message && <p role={message.error ? "alert" : "status"} className={`${styles.notice} ${message.error ? styles.error : ""}`}>{message.text}</p>}
    {!data && <button onClick={() => { setBusy(true); reload().catch(() => {}).finally(() => setBusy(false)); }} disabled={busy}>Try again</button>}
    {data && <>
      <div className={styles.toolbar}>
        {data.cycles.length > 1 ? <label>Reporting year<select disabled={busy || Boolean(editing)} value={cycle?.id ?? ""} onChange={async (e) => {
          setBusy(true); setSettings(null); setStudentId("");
          try { await reload(e.target.value); } catch { /* reload displays the error */ } finally { setBusy(false); }
        }}>{data.cycles.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label> : <h2 className={styles.sectionTitle}>{cycle?.label ?? "Reporting year"}</h2>}
        <div className={styles.actions}>
          {data.teacher ? <>
            {cycle && <button disabled={busy} onClick={() => exportOverview(data)}>Export CSV</button>}
            {cycle && !cycle.locked && !data.students.some((s) => s.entries.length) && <button disabled={busy} onClick={() => setSettings("edit")}>Year settings</button>}
            <button disabled={busy} onClick={() => setSettings("new")}>{cycle ? "New reporting year" : "Set up reporting year"}</button>
          </> : cycle && !editing && <button className={styles.primary} onClick={() => openForm("new")}>+ Add activity</button>}
        </div>
      </div>
      {settings && data.teacher && <ActivityCycleForm key={`${settings}-${cycle?.id}`} guideId={guideId} cycle={settings === "edit" ? cycle ?? undefined : undefined} onCancel={() => setSettings(null)} onSaved={async () => { await reload(); setSettings(null); setStudentId(""); router.refresh(); }} />}
      {!cycle && !settings && <p className={styles.empty}>{data.teacher ? "Set the semester dates to open this activity log for students. The defaults are 15 hours per semester and a 10-hour activity cap." : "Your teacher is setting up this activity log. Check back soon."}</p>}
      {cycle && data.teacher && <>
        <p className={styles.muted}>Select a student to review their activities. Totals include approved credit and carry-forward.</p>
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th>Student</th>{cycle.periods.map((p) => <th key={p.id}>{p.label}</th>)}<th>Awaiting approval</th><th>Status</th></tr></thead>
          <tbody>{data.students.map((s) => <tr key={s.id} aria-selected={s.id === studentId}>
            <td><button onClick={() => { setStudentId(s.id); requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>{s.name}</button></td>
            {s.progress.periods.map((p) => <td key={p.id}>{time(p.creditedMinutes)} / {time(p.targetMinutes)}</td>)}
            <td>{time(s.progress.pendingMinutes)}</td><td>{s.progress.complete ? "Complete" : s.entries.length ? "In progress" : "Not started"}</td>
          </tr>)}</tbody>
        </table>{!data.students.length && <p className={styles.empty}>No students yet.</p>}</div>
      </>}
      {cycle && student && <section ref={detailRef} aria-label={data.teacher ? `${student.name}'s activities` : "Your activities"}>
        {data.teacher && <h2 className={styles.sectionTitle} style={{ marginBottom: 12 }}>{student.name}</h2>}
        <ActivityProgress progress={student.progress} />
        <div ref={formRef}>{editing && !data.teacher && <ActivityForm key={editing === "new" ? "new" : `${editing.id}-${editing.revision}`} cycle={cycle} entry={editing === "new" ? undefined : editing} onCancel={() => setEditing(null)} onSave={async (input) => {
          const result = await mutate(() => saveActivityEntry(input)); if (result.success) setEditing(null); return result;
        }} />}</div>
        <div className={styles.toolbar}>
          <h2 className={styles.sectionTitle}>{data.teacher ? "Activities" : "Your activities"}</h2>
          {data.teacher && student.entries.some((e) => e.status === "pending") && <button className={styles.primary} disabled={busy} onClick={() => mutate(() => reviewActivityEntries(guideId, cycle.id, student.entries.filter((e) => e.status === "pending").slice(0, 100).map(({ id, revision }) => ({ id, revision })), "approved"))}>Approve pending ({Math.min(100, student.entries.filter((e) => e.status === "pending").length)})</button>}
        </div>
        <div className={styles.entries}>
          {!student.entries.length && <p className={styles.empty}>{data.teacher ? "No activities recorded yet." : "Add your first activity. A short description and a photo are a good place to start."}</p>}
          {student.entries.map((entry) => <EntryDetails key={`${entry.id}-${entry.revision}`} entry={entry} student={student} teacher={data.teacher} busy={busy} cap={cycle.activityCapMinutes} onEdit={() => openForm(entry)} onDelete={() => mutate(() => deleteActivityEntry(guideId, entry.id, entry.revision))} onReview={(decision, comment) => mutate(() => reviewActivityEntries(guideId, cycle.id, [{ id: entry.id, revision: entry.revision }], decision, comment))} />)}
        </div>
        <p className={styles.muted} style={{ marginTop: 12 }}>Maximum {time(cycle.activityCapMinutes)} credited per activity. To record more time on the same activity, edit it and add another date.</p>
      </section>}
    </>}
    <details className={styles.instructions}><summary>Guide &amp; requirements</summary><div>
      {cycle && <p>Record your participation and include one or two images. Your teacher approves the credit. Extra approved hours carry forward to the next semester; later hours do not fill an earlier semester&apos;s shortfall.</p>}
      <MarkdownReader>{description}</MarkdownReader>
      {guideDetails && <>
        {guideDetails.themeIdea?.description && <MarkdownReader>{guideDetails.themeIdea.description}</MarkdownReader>}
        {(guideDetails.knowledge?.length > 0 || guideDetails.skills?.length > 0) && <><h3>Learning goals</h3><ul style={{ paddingLeft: 22 }}>{guideDetails.knowledge?.map((k, i) => <li key={`k${i}`}>{k.knowledge}</li>)}{guideDetails.skills?.map((s, i) => <li key={`s${i}`}>{s.skill}</li>)}</ul></>}
        {collectMaterials(guideDetails).map((material) => <p key={material.link}><a href={material.link} target="_blank" rel="noopener noreferrer">{material.title}</a></p>)}
      </>}
    </div></details>
  </main>;
}

function EntryDetails({ entry, student, teacher, busy, cap, onEdit, onDelete, onReview }: {
  entry: ActivityEntry; student: ActivityStudent; teacher: boolean; busy: boolean; cap: number;
  onEdit: () => void; onDelete: () => Promise<ActionResult<void>>;
  onReview: (decision: "approved" | "changesRequested", comment?: string) => Promise<ActionResult<void>>;
}) {
  const [deleting, setDeleting] = useState(false); const [reviewing, setReviewing] = useState(false); const [comment, setComment] = useState("");
  const total = entry.sessions.reduce((sum, s) => sum + s.minutes, 0);
  return <details className={styles.entry}>
    <summary><span className={styles.entryTitle}>{entry.name}</span><span className={styles.entryMeta}>{time(total)} recorded{entry.status === "approved" ? ` · ${time(student.progress.entryCredits[entry.id] ?? 0)} approved` : ""}</span><span className={styles.badge} data-status={entry.status}>{statusLabel[entry.status]}</span></summary>
    <div className={styles.entryBody}>
      <p className={styles.muted}>{entry.location || "Location not added"}</p>
      <ul>{entry.sessions.map((s, i) => <li key={i}>{new Date(`${s.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · {time(s.minutes)}</li>)}</ul>
      {total > cap && <p className={styles.muted}>{time(total - cap)} is above this activity&apos;s credit cap. All your recorded time is kept.</p>}
      <p>{entry.description || "No description yet."}</p>
      {entry.teacherComment && <p className={styles.notice}><strong>Teacher feedback:</strong> {entry.teacherComment}</p>}
      <div className={styles.images}>{entry.imageIds.map((id, i) => <a href={`/api/activity-images/${entry.id}/${id}`} key={id} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/activity-images/${entry.id}/${id}`} loading="lazy" alt={`${entry.name}, evidence ${i + 1} (open full image)`} />
      </a>)}</div>
      {entry.links.length > 0 && <ul>{entry.links.map((link) => <li key={link}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>)}</ul>}
      <div className={styles.actions}>
        {!teacher ? <>
          <button disabled={busy} onClick={onEdit}>Edit activity</button>
          {!deleting ? <button disabled={busy} onClick={() => setDeleting(true)}>Delete</button> : <><span>Remove this activity and its hours?</span><button className={styles.danger} disabled={busy} onClick={onDelete}>Delete activity</button><button onClick={() => setDeleting(false)}>Keep it</button></>}
        </> : ["pending", "approved"].includes(entry.status) && <>
          {entry.status === "pending" && <button className={styles.primary} disabled={busy} onClick={() => onReview("approved")}>Approve</button>}
          <button disabled={busy} onClick={() => setReviewing(!reviewing)}>{entry.status === "approved" ? "Reopen for changes" : "Request changes"}</button>
        </>}
      </div>
      {reviewing && <form onSubmit={(e) => { e.preventDefault(); onReview("changesRequested", comment); }}>
        <label>What should the student change?<textarea required maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} rows={2} /></label>
        <button disabled={busy} type="submit" style={{ marginTop: 8 }}>Send feedback</button>
      </form>}
    </div>
  </details>;
}

function exportOverview(data: ActivityLogData) {
  if (!data.cycle) return;
  const rows: (string | number)[][] = [
    ["Student", "Reporting year", ...data.cycle.periods.flatMap((p) => [`${p.label} credited hours`, `${p.label} carried-in hours`]), "Recorded hours", "Pending recorded hours", "Status"],
    ...data.students.map((s) => [s.name, data.cycle!.label, ...s.progress.periods.flatMap((p) => [p.creditedMinutes / 60, p.carriedInMinutes / 60]), s.progress.recordedMinutes / 60, s.progress.pendingMinutes / 60, s.progress.complete ? "Complete" : "Incomplete"]),
  ];
  const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map((r) => r.map(activityCsvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "activity-hours.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

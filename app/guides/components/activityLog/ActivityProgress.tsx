import type { ActivityProgress as Progress } from "types/activityLogTypes";
import { formatActivityTime as time } from "utils/activityLog";
import styles from "./ActivityLog.module.css";

export function ActivityProgress({ progress }: { progress: Progress }) {
  return <>
    <div className={styles.progress}>
      {progress.periods.map((period, i) => <section className={styles.period} key={period.id} aria-label={`${period.label} progress`}>
        <h2>{period.label}</h2>
        <p className={styles.muted}>{shortDate(period.startDate)} – {shortDate(period.endDate)}</p>
        <div><strong>{time(period.creditedMinutes)}</strong> / {time(period.targetMinutes)}</div>
        <progress aria-label={`${period.label} credited hours`} value={period.creditedMinutes} max={period.targetMinutes} />
        <p>{period.remainingMinutes ? `${time(period.remainingMinutes)} to go` : "Target reached"}</p>
        {period.carriedInMinutes > 0 && <p>{time(period.carriedInMinutes)} carried from {progress.periods[i - 1]?.label}</p>}
      </section>)}
    </div>
    <p className={styles.summary}>
      {progress.complete ? "All hour targets reached." : `${time(progress.creditedMinutes)} of ${time(progress.targetMinutes)} credited.`}
      {progress.pendingMinutes > 0 && ` ${time(progress.pendingMinutes)} recorded time awaiting approval.`}
    </p>
  </>;
}

const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

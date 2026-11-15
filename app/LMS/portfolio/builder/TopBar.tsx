import styles from "./TopBar.module.css";

// These actions will be connected in their separate tasks.
export default function TopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <img src="/portfolio/icons/logo.svg" alt="" width="21" height="34" />
        <span>VEFSKÓLINN</span>
      </div>

      <div className={styles.status}>
        <span className={styles.statusDot} aria-hidden="true" />
        Not published yet
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton} type="button" disabled title="Settings coming later" aria-label="Settings (coming later)">
          <img src="/portfolio/icons/settings.svg" alt="" width="16" height="16" />
        </button>
        <button className={styles.actionButton} type="button" disabled title="Preview coming later">
          <img src="/portfolio/icons/preview.svg" alt="" width="15" height="15" />
          Preview
        </button>
        <button className={styles.publishButton} type="button" disabled title="Publishing coming later">
          Publish portfolio
          <img src="/portfolio/icons/publish.svg" alt="" width="15" height="15" />
        </button>
        <span className={styles.avatar} aria-label="Student avatar placeholder">AJ</span>
      </div>
    </header>
  );
}

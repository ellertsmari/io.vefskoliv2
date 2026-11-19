import Image from "next/image";
import logoIcon from "public/portfolio/icons/logo.svg";
import settingsIcon from "public/portfolio/icons/settings.svg";
import previewIcon from "public/portfolio/icons/preview.svg";
import publishIcon from "public/portfolio/icons/publish.svg";
import styles from "./TopBar.module.css";

// These actions will be connected in their separate tasks.
export default function TopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <Image src={logoIcon} alt="" width={21} height={34} />
        <span>VEFSKÓLINN</span>
      </div>

      <div className={styles.status}>
        <span className={styles.statusDot} aria-hidden="true" />
        Not published yet
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton} type="button" disabled title="Settings coming later" aria-label="Settings (coming later)">
          <Image src={settingsIcon} alt="" width={16} height={16} />
        </button>
        <button className={styles.actionButton} type="button" disabled title="Preview coming later">
          <Image src={previewIcon} alt="" width={15} height={15} />
          Preview
        </button>
        <button className={styles.publishButton} type="button" disabled title="Publishing coming later">
          Publish portfolio
          <Image src={publishIcon} alt="" width={15} height={15} />
        </button>
        <span className={styles.avatar} aria-label="Student avatar placeholder">AJ</span>
      </div>
    </header>
  );
}

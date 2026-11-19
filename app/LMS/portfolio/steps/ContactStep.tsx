"use client";

import { useState } from "react";
import styles from "./ContactStep.module.css";

export default function ContactStep() {
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <label className={styles.field}>
        <span>EMAIL (OPTIONAL)</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <small>Your email will only appear on your public portfolio if you add one.</small>
      </label>

      <label className={styles.field}>
        <span>LINKEDIN</span>
        <input
          type="url"
          value={linkedin}
          onChange={(event) => setLinkedin(event.target.value)}
          placeholder="https://www.linkedin.com/in/your-name"
        />
      </label>

      <label className={styles.field}>
        <span>GITHUB</span>
        <input
          type="url"
          value={github}
          onChange={(event) => setGithub(event.target.value)}
          placeholder="https://github.com/your-name"
        />
      </label>

      <p className={styles.note}>
        Add only the contact links you want to share. CV upload is waiting for a team decision.
        Saving these fields will be connected when the shared draft API is ready.
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import { ImageUploadField } from "UIcomponents/imageUpload/ImageUploadField";
import styles from "./ProfileStep.module.css";

// Issue #34: these values are local until the shared draft API is connected.
export default function ProfileStep() {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const aboutWordCount = (about.match(/\S+/g) || []).length;

  function updateAbout(text: string) {
    if ((text.match(/\S+/g) || []).length <= 1000) {
      setAbout(text);
    }
  }
  const [photoUrl, setPhotoUrl] = useState("");
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [openToInternships, setOpenToInternships] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [lookingFor, setLookingFor] = useState("");

  function addSkill() {
    const skill = newSkill.trim();
    if (skill && !skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setSkills([...skills, skill]);
    }
    setNewSkill("");
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((item) => item !== skill));
  }

  function loadFigmaExample() {
    setName("Anna Jónsdóttir");
    setHeadline("Frontend developer");
    setTagline("Creative thinker");
    setAbout("I’m a frontend student at Vefskólinn. I enjoy turning designs into accessible, responsive websites and I care about the small details that make them feel finished.");
    setLocation("Reykjavík · remote");
    setLanguages("Icelandic, English");
    setSkills(["HTML", "CSS", "JavaScript", "TypeScript", "React", "Figma"]);
    setOpenToInternships(true);
    setAvailableFrom("2027-01");
    setLookingFor("Frontend / UI internship");
  }

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <button className={styles.demoButton} type="button" onClick={loadFigmaExample}>Load Figma example (demo only)</button>
      <div className={styles.photoRow}>
        <div className={styles.photoBox}>
          {photoUrl ? <img src={photoUrl} alt="Profile photo preview" /> : <span aria-hidden="true">▧</span>}
        </div>
        <ImageUploadField
          id="portfolioPhoto"
          prefix="portfolio-profile"
          label="PROFILE PHOTO"
          description="JPG or PNG · square images work best"
          value={photoUrl}
          onChange={setPhotoUrl}
        />
      </div>

      <label className={styles.field}>
        <span>NAME</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
      </label>

      <div className={styles.twoColumns}>
        <label className={styles.field}>
          <span>ROLE / HEADLINE</span>
          <input value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Frontend developer" />
        </label>
        <label className={styles.field}>
          <span>SECOND LINE</span>
          <input value={tagline} onChange={(event) => setTagline(event.target.value)} placeholder="Creative thinker" />
        </label>
      </div>

      <label className={styles.field}>
        <span>ABOUT ME</span>
        <textarea rows={7} value={about} onChange={(event) => updateAbout(event.target.value)} placeholder="Who you are, what you enjoy building and what you're looking for next." />
        <small>{aboutWordCount} / 1000 words</small>
      </label>

      <div className={styles.availability}>
        <label className={styles.switchRow}>
          <span>
            <strong>Open to internships</strong>
            <small>Show an availability badge on your portfolio</small>
          </span>
          <input type="checkbox" checked={openToInternships} onChange={(event) => setOpenToInternships(event.target.checked)} />
        </label>

        {openToInternships && (
          <>
            <label className={styles.field}>
              <span>AVAILABLE FROM</span>
              <input type="month" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>LOOKING FOR</span>
              <input value={lookingFor} onChange={(event) => setLookingFor(event.target.value)} placeholder="Frontend / UI internship" />
            </label>
          </>
        )}
      </div>

      <label className={styles.field}>
        <span>LOCATION</span>
        <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Reykjavík · remote" />
      </label>

      <div className={styles.field}>
        <span>SKILLS</span>
        <div className={styles.skills}>
          {skills.map((skill) => (
            <button type="button" key={skill} onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
              {skill} ×
            </button>
          ))}
        </div>
        <div className={styles.skillInput}>
          <input aria-label="New skill" value={newSkill} onChange={(event) => setNewSkill(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }} placeholder="Add a skill" />
          <button type="button" onClick={addSkill}>+ Add</button>
        </div>
        <small>Choose your technologies, or type your own.</small>
      </div>

      <label className={styles.field}>
        <span>LANGUAGES</span>
        <input value={languages} onChange={(event) => setLanguages(event.target.value)} placeholder="e.g. Icelandic, English" />
      </label>

      <p className={styles.draftNote}>Your changes are local to this page for now. Saving and live preview will be connected in a separate task.</p>
    </form>
  );
}

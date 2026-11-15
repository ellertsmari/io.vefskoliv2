import styles from "./DemoPortfolio.module.css";

// Sample information from the Figma screenshots. No database is used here.
const projects = [
  { name: "Nordic Trails", type: "Web design", module: "Module 2", picture: "trails" },
  { name: "Form / Function", type: "Editorial", module: "Module 3", picture: "forms" },
  { name: "Field Notes", type: "Digital product", module: "Module 4", picture: "notes" },
];

export default function DemoPortfolio() {
  return (
    <div className={styles.portfolio}>
      <p className={styles.demoNotice}>DEMO PROFILE · SAMPLE DATA FROM FIGMA · NOT PUBLISHED</p>
      <header className={styles.portfolioHeader}>
        <div className={styles.smallBrand}>✦ VEFSKÓLINN</div>
        <nav className={styles.portfolioNav} aria-label="Demo portfolio pages">
          <span className={styles.activeTab}>Work</span>
          <span>About</span>
          <span>Contact</span>
        </nav>
      </header>

      <div className={styles.location}>REYKJAVÍK, ICELAND <span>● AVAILABLE · JAN 2027</span></div>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>PORTFOLIO · 2024–26</p>
        <h2>Anna <span>Jónsdóttir</span></h2>
        <p className={styles.headline}>Frontend developer. <em>Creative thinker.</em></p>
        <p className={styles.about}>I’m a frontend student at Vefskólinn. I enjoy turning designs into accessible, responsive websites and I care about the small details that make them feel finished.</p>
        <div className={styles.details}>
          <span>LOOKING FOR <strong>Frontend / UI internship</strong></span>
          <span>AVAILABLE <strong>January 2027</strong></span>
          <span>BASED IN <strong>Reykjavík · remote</strong></span>
          <span>LANGUAGES <strong>Icelandic, English</strong></span>
        </div>
      </section>

      <section className={styles.work} aria-labelledby="sample-work-heading">
        <h3 id="sample-work-heading">Selected work <small>03 PROJECTS</small></h3>
        <div className={styles.projectGrid}>
          {projects.map((project) => (
            <article className={styles.projectCard} key={project.name}>
              <div className={`${styles.projectPicture} ${styles[project.picture]}`}>
                <span>{project.module}</span>
              </div>
              <div className={styles.projectText}>
                <h4>{project.name}</h4>
                <p>{project.type} · {project.module}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.skills}>
        <h3>Skills &amp; technologies</h3>
        <p>HTML · CSS · JavaScript · TypeScript · React · Figma</p>
      </section>

      <footer className={styles.footer}>
        <p className={styles.availability}>● Available for internships from January 2027</p>
        <h3>Let’s build something together.</h3>
        <div className={styles.contacts}>
          <span>E-MAIL · anna@example.com</span>
          <span>LinkedIn · linkedin.com/in/annajons</span>
          <span>GitHub</span>
          <span>CV (PDF)</span>
        </div>
        <p className={styles.madeWith}>Portfolio made with Vefskólinn · 2027</p>
      </footer>
    </div>
  );
}

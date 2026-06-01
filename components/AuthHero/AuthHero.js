import styles from "./AuthHero.module.css";

export default function AuthHero() {
  return (
    <aside className={styles.hero} aria-hidden="true">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Gestão de projetos</p>
          <blockquote className={styles.quote}>
            <p>
              O workspace que mantém sua operação <em>no mesmo lugar</em>
            </p>
            <footer>
              Clientes, pastas, projetos e prazos — sem planilha paralela, sem caos.
            </footer>
          </blockquote>
        </div>

        <div className={styles.logoWrap}>
          <img src="/myboardlogo.png" alt="" className={styles.heroLogo} />
        </div>
      </div>
    </aside>
  );
}

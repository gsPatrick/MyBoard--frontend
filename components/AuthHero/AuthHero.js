import styles from "./AuthHero.module.css";

export default function AuthHero() {
  return (
    <aside className={styles.hero} aria-hidden="true">
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.brand}>
          <span className={styles.logoMark}>M</span>
          <span className={styles.logoText}>MyBoard</span>
        </div>

        <div className={styles.mockup}>
          <div className={styles.mockupBar}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.mockupBody}>
            <div className={styles.mockupSidebar} />
            <div className={styles.mockupMain}>
              <div className={styles.mockupCard} />
              <div className={styles.mockupCardWide} />
              <div className={styles.mockupRow}>
                <div className={styles.mockupCardSm} />
                <div className={styles.mockupCardSm} />
                <div className={styles.mockupCardSm} />
              </div>
            </div>
          </div>
        </div>

        <blockquote className={styles.quote}>
          <p>Organize clientes, projetos e prazos em um só lugar.</p>
          <footer>Gerencie seu trabalho como um workspace profissional.</footer>
        </blockquote>
      </div>
    </aside>
  );
}

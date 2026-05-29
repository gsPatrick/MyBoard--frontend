import styles from "./MarketingHeroVisual.module.css";

export default function MarketingHeroVisual() {
  return (
    <div className={styles.heroVisual} aria-hidden="true">
      <div className={styles.heroOrb} />
      <div className={styles.heroApp}>
        <div className={styles.appChrome}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.appLayout}>
          <aside className={styles.appSidebar}>
            <div className={styles.appSideTitle} />
            <div className={`${styles.appSideItem} ${styles.animDelay1}`} />
            <div className={`${styles.appSideItem} ${styles.animDelay2}`} />
            <div className={`${styles.appSideFolder} ${styles.animDelay3}`} />
            <div className={`${styles.appSideItem} ${styles.animDelay4}`} />
            <div className={`${styles.appSideItem} ${styles.animDelay5}`} />
          </aside>
          <div className={styles.appMain}>
            <div className={styles.appTabs}>
              <span className={styles.appTabActive} />
              <span />
              <span />
            </div>
            <div className={`${styles.appCard} ${styles.animFloat}`}>
              <div className={styles.appCardRow}>
                <span className={styles.appAvatar} />
                <div>
                  <div className={styles.appLine} />
                  <div className={styles.appLineShort} />
                </div>
              </div>
            </div>
            <div className={`${styles.appCard} ${styles.animFloatDelayed}`}>
              <div className={styles.appLine} />
              <div className={styles.appLine} />
              <div className={styles.appLineShort} />
            </div>
          </div>
        </div>
        <div className={`${styles.floatingPill} ${styles.pillLeft}`}>
          <span className={styles.pillDot} />
          Em andamento
        </div>
        <div className={`${styles.floatingPill} ${styles.pillRight}`}>
          <span className={`${styles.pillDot} ${styles.pillDotWarn}`} />
          2 prazos hoje
        </div>
      </div>
    </div>
  );
}

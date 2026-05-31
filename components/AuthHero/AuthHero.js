import Link from "next/link";
import MarketingHeroVisual from "@/components/MarketingHeroVisual/MarketingHeroVisual";
import styles from "./AuthHero.module.css";

export default function AuthHero() {
  return (
    <aside className={styles.hero} aria-hidden="true">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <img src="/myboardlogo.png" alt="MyBoard" className={styles.brandLogo} />
        </Link>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>Gestão de projetos</p>
          <blockquote className={styles.quote}>
            <p>
              O workspace que mantém sua operação{" "}
              <em>no mesmo lugar</em>
            </p>
            <footer>
              Clientes, pastas, projetos e prazos — sem planilha paralela, sem caos.
            </footer>
          </blockquote>
        </div>

        <MarketingHeroVisual />
      </div>
    </aside>
  );
}

import ProjectHero from "@/components/ProjectHero/ProjectHero";
import RoadTimeline from "@/components/RoadTimeline/RoadTimeline";
import LatestFiles from "@/components/LatestFiles/LatestFiles";
import SpendingsTable from "@/components/SpendingsTable/SpendingsTable";
import styles from "@/app/dashboard/page.module.css";

export default function CentralView() {
  return (
    <div className={styles.tabContent}>
      <ProjectHero />
      <div className={styles.grid}>
        <RoadTimeline />
        <LatestFiles />
      </div>
      <SpendingsTable />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader/DashboardHeader";
import DashboardRightBar from "@/components/DashboardRightBar/DashboardRightBar";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import DashboardTabs from "@/components/DashboardTabs/DashboardTabs";
import DashboardCenter from "@/components/DashboardViews/DashboardCenter";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
import { DashboardNavProvider } from "@/context/DashboardNavContext";
import { DashboardTabProvider } from "@/context/DashboardTabContext";
import { DashboardLayoutProvider, useDashboardLayout } from "@/context/DashboardLayoutContext";
import { KeyboardShortcutsProvider } from "@/context/KeyboardShortcutsContext";
import WorkspaceSearch from "@/components/WorkspaceSearch/WorkspaceSearch";
import DailyFocusModal from "@/components/DailyFocusModal/DailyFocusModal";
import OnboardingTour from "@/components/OnboardingTour/OnboardingTour";
import OnboardingWelcomeModal from "@/components/OnboardingWelcomeModal/OnboardingWelcomeModal";
import Toaster from "@/components/Toast/Toaster";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { getToken } from "@/api/client";
import styles from "./page.module.css";

function DashboardShell() {
  const { leftSidebarOpen, rightSidebarOpen } = useDashboardLayout();

  const layoutClass = [
    styles.dashboard,
    !leftSidebarOpen && styles.leftClosed,
    !rightSidebarOpen && styles.rightClosed,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={layoutClass}>
        <aside
          className={styles.leftSlot}
          aria-hidden={!leftSidebarOpen}
          inert={!leftSidebarOpen ? true : undefined}
        >
          <div className={styles.leftInner}>
            <DashboardSidebar />
          </div>
        </aside>

        <div className={styles.center}>
          <DashboardHeader />
          <main className={styles.main}>
            <DashboardTabs />
            <DashboardCenter />
          </main>
        </div>

        <aside
          className={styles.rightSlot}
          aria-hidden={!rightSidebarOpen}
          inert={!rightSidebarOpen ? true : undefined}
        >
          <div className={styles.rightInner}>
            <DashboardRightBar />
          </div>
        </aside>
      </div>
      <WorkspaceSearch />
      <OnboardingTour />
      <OnboardingWelcomeModal />
      <DailyFocusModal />
      <Toaster />
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    const stored = localStorage.getItem("snowui-theme");
    if (!stored) {
      setTheme("dark");
    }
  }, [setTheme, router]);

  return (
    <DashboardTabProvider>
      <DashboardNavProvider>
        <DashboardLayoutProvider>
          <KeyboardShortcutsProvider>
            <OnboardingProvider>
              <DashboardShell />
            </OnboardingProvider>
          </KeyboardShortcutsProvider>
        </DashboardLayoutProvider>
      </DashboardNavProvider>
    </DashboardTabProvider>
  );
}

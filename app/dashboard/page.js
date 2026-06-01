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
import { SIDEBAR_MODE } from "@/lib/sidebarLayout";
import { CONTENT_WIDTH } from "@/lib/interfacePreferences";
import { KeyboardShortcutsProvider } from "@/context/KeyboardShortcutsContext";
import WorkspaceSearch from "@/components/WorkspaceSearch/WorkspaceSearch";
import DailyFocusModal from "@/components/DailyFocusModal/DailyFocusModal";
import OnboardingTour from "@/components/OnboardingTour/OnboardingTour";
import OnboardingWelcomeModal from "@/components/OnboardingWelcomeModal/OnboardingWelcomeModal";
import BordieChat from "@/components/BordieChat/BordieChat";
import Toaster from "@/components/Toast/Toaster";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { BordieChatProvider, useBordieChat } from "@/context/BordieChatContext";
import { getToken } from "@/api/client";
import styles from "./page.module.css";

function DashboardShell() {
  const {
    leftSidebarMode,
    rightSidebarMode,
    leftSidebarOpen,
    rightSidebarOpen,
    contentWidth,
  } = useDashboardLayout();
  const { bordieDocked } = useBordieChat();

  const layoutClass = [
    styles.dashboard,
    leftSidebarMode === SIDEBAR_MODE.HIDDEN && styles.leftClosed,
    leftSidebarMode === SIDEBAR_MODE.COMPACT && styles.leftCompact,
    !bordieDocked && rightSidebarMode === SIDEBAR_MODE.HIDDEN && styles.rightClosed,
    !bordieDocked && rightSidebarMode === SIDEBAR_MODE.COMPACT && styles.rightCompact,
    bordieDocked && styles.bordieDocked,
    contentWidth === CONTENT_WIDTH.FULL && styles.contentFull,
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
            <DashboardSidebar compact={leftSidebarMode === SIDEBAR_MODE.COMPACT} />
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
          aria-hidden={!bordieDocked && !rightSidebarOpen}
          inert={!bordieDocked && !rightSidebarOpen ? true : undefined}
        >
          {bordieDocked ? (
            <div id="bordie-dock-root" className={styles.bordieDockRoot} />
          ) : (
            <div className={styles.rightInner}>
              <DashboardRightBar compact={rightSidebarMode === SIDEBAR_MODE.COMPACT} />
            </div>
          )}
        </aside>
      </div>
      <WorkspaceSearch />
      <BordieChat />
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
          <BordieChatProvider>
            <KeyboardShortcutsProvider>
              <OnboardingProvider>
                <DashboardShell />
              </OnboardingProvider>
            </KeyboardShortcutsProvider>
          </BordieChatProvider>
        </DashboardLayoutProvider>
      </DashboardNavProvider>
    </DashboardTabProvider>
  );
}

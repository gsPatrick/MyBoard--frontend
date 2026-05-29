"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Tab from "@/components/Tab/Tab";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import { getClient } from "@/api/clients";
import { listFinancialEntries } from "@/api/finance";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { normalizeListResponse } from "@/lib/apiList";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import {
  CLIENT_CHIP_STATUS,
  CLIENT_STATUS_LABELS,
  IMPORTANCE_LABELS,
} from "@/lib/clientLabels";
import { sumEntryAmounts } from "@/lib/financialStats";
import { formatCurrencyBRL } from "@/lib/projectStats";
import ClientDetailAside from "./ClientDetailAside";
import ClientOverviewSection from "./sections/ClientOverviewSection";
import ClientContactSection from "./sections/ClientContactSection";
import ClientProjectsSection from "./sections/ClientProjectsSection";
import ClientNotesSection from "./sections/ClientNotesSection";
import ClientFinancialSection from "./sections/ClientFinancialSection";
import styles from "../ProjectDetail/ProjectDetailView.module.css";

const SECTIONS = [
  { id: "overview", label: "Visão geral" },
  { id: "contact", label: "Contato" },
  { id: "projects", label: "Projetos" },
  { id: "notes", label: "Observações" },
  { id: "financial", label: "Financeiro" },
];

export default function ClientDetailView() {
  const { selectedClient, clearClient, openLucroForClient } = useDashboardNav();
  const { setActiveTab } = useDashboardTab();
  const [client, setClient] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  const projects = client?.projects || [];
  const totalReceived = useMemo(() => sumEntryAmounts(entries), [entries]);

  const reload = useCallback(async () => {
    if (!selectedClient?.id) return;

    setLoading(true);
    setError(null);

    try {
      await ensureActiveTenant();
      const [clientData, entriesData] = await Promise.all([
        getClient(selectedClient.id),
        listFinancialEntries({ client_id: selectedClient.id, limit: 100 }),
      ]);
      setClient(clientData);
      setEntries(normalizeListResponse(entriesData));
    } catch {
      setClient(null);
      setEntries([]);
      setError("Não foi possível carregar o cliente.");
    } finally {
      setLoading(false);
    }
  }, [selectedClient?.id]);

  useEffect(() => {
    reload();
    window.addEventListener("myboard:workspace-refresh", reload);
    return () => window.removeEventListener("myboard:workspace-refresh", reload);
  }, [reload]);

  function handleOpenLucro() {
    if (!client) return;
    openLucroForClient(client);
    setActiveTab("lucro");
  }

  if (!selectedClient) return null;

  if (loading) {
    return <p className={styles.loading}>Carregando cliente...</p>;
  }

  if (error || !client) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.back} onClick={clearClient}>
          ← Voltar
        </button>
        <p className={styles.error}>{error || "Cliente não encontrado."}</p>
      </div>
    );
  }

  const statusConfig =
    CLIENT_CHIP_STATUS[client.status] || CLIENT_CHIP_STATUS.active;
  const displayName = client.name || selectedClient.name;

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={clearClient}>
        ← Voltar aos clientes
      </button>

      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroTop}>
            <Avatar
              src={getClientAvatarUrl(client)}
              name={displayName}
              size="lg"
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 className={styles.title}>{displayName}</h1>
              {client.company && (
                <p className={styles.client}>{client.company}</p>
              )}
            </div>
          </div>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Status</span>
              <Chip status={statusConfig.chip}>
                {CLIENT_STATUS_LABELS[client.status] || statusConfig.label}
              </Chip>
            </div>
            <span className={styles.divider} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Projetos</span>
              <p className={styles.metricValue}>{projects.length}</p>
            </div>
            <span className={styles.divider} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Recebido</span>
              <p className={styles.metricValue}>
                {totalReceived > 0 ? formatCurrencyBRL(totalReceived) : "—"}
              </p>
            </div>
            <span className={styles.divider} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Importância</span>
              <p className={styles.metricValue}>
                {IMPORTANCE_LABELS[client.importance_level] || "—"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <nav className={styles.tabs} role="tablist" aria-label="Seções do cliente">
            {SECTIONS.map((section) => (
              <Tab
                key={section.id}
                label={section.label}
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </nav>

          <div className={styles.body}>
            {activeSection === "overview" && (
              <ClientOverviewSection
                client={client}
                projectsCount={projects.length}
                totalReceived={totalReceived}
                onNavigate={setActiveSection}
                onOpenLucro={handleOpenLucro}
              />
            )}

            {activeSection === "contact" && (
              <ClientContactSection client={client} onSaved={setClient} />
            )}

            {activeSection === "projects" && (
              <ClientProjectsSection client={client} projects={projects} />
            )}

            {activeSection === "notes" && (
              <ClientNotesSection client={client} onSaved={setClient} />
            )}

            {activeSection === "financial" && (
              <ClientFinancialSection
                client={client}
                entries={entries}
                totalReceived={totalReceived}
              />
            )}
          </div>
        </div>

        <ClientDetailAside client={client} onClientChange={setClient} />
      </div>
    </div>
  );
}

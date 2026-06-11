"use client";

import { useCallback, useEffect, useState } from "react";
import ClientsTable from "@/components/ClientsTable/ClientsTable";
import { listClients } from "@/services/clients";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import styles from "./ClientesView.module.css";

export default function ClientesView() {
  const { selectClient } = useDashboardNav();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      const data = await listClients({ limit: 100, include_inactive: "true" });
      setClients(normalizeListResponse(data));
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("myboard:workspace-refresh", load);
    window.addEventListener("myboard:tenant-changed", load);
    return () => {
      window.removeEventListener("myboard:workspace-refresh", load);
      window.removeEventListener("myboard:tenant-changed", load);
    };
  }, [load]);

  return (
    <section className={styles.card}>
      <div className={styles.header} data-tour="clientes-onboarding-anchor">
        <h2 className={styles.title}>Todos os clientes</h2>
        <span className={styles.count}>
          {loading ? "—" : `${clients.length} cliente(s)`}
        </span>
      </div>

      {loading && <p className={styles.empty}>Carregando...</p>}

      {!loading && (
        <ClientsTable
          clients={clients}
          onClientClick={selectClient}
          emptyMessage="Nenhum cliente cadastrado"
        />
      )}
    </section>
  );
}

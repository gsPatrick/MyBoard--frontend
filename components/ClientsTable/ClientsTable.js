"use client";

import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import {
  CLIENT_CHIP_STATUS,
  CLIENT_STATUS_LABELS,
  IMPORTANCE_LABELS,
} from "@/lib/clientLabels";
import styles from "./ClientsTable.module.css";

function contactLine(client) {
  if (client.email && client.phone) {
    return `${client.email} · ${client.phone}`;
  }
  return client.email || client.phone || "—";
}

export default function ClientsTable({
  clients,
  onClientClick,
  emptyMessage = "Nenhum cliente encontrado",
}) {
  if (!clients.length) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.table}>
      <div className={styles.col}>
        <div className={styles.th}>Cliente</div>
        {clients.map((client) => (
          <button
            key={client.id}
            type="button"
            className={`${styles.cellManager} ${styles.rowButton}`}
            onClick={() => onClientClick?.(client)}
          >
            <Avatar
              src={getClientAvatarUrl(client)}
              name={client.name}
              size="sm"
            />
            <span className={styles.nameBlock}>
              <span className={styles.clientName}>{client.name}</span>
              <span className={styles.subName}>
                {client.company || client.document || "—"}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Contato</div>
        {clients.map((client) => (
          <div key={client.id} className={styles.cell}>
            {contactLine(client)}
          </div>
        ))}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Importância</div>
        {clients.map((client) => (
          <div key={client.id} className={styles.cell}>
            {IMPORTANCE_LABELS[client.importance_level] || client.importance_level || "—"}
          </div>
        ))}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Status</div>
        {clients.map((client) => {
          const statusConfig =
            CLIENT_CHIP_STATUS[client.status] || CLIENT_CHIP_STATUS.active;

          return (
            <div key={client.id} className={styles.cellStatus}>
              <Chip status={statusConfig.chip}>
                {CLIENT_STATUS_LABELS[client.status] || statusConfig.label}
              </Chip>
            </div>
          );
        })}
      </div>
    </div>
  );
}

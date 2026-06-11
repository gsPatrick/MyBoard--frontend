"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import {
  addClientWhatsappLink,
  formatWhatsappPhone,
  listClientWhatsappLinks,
  removeClientWhatsappLink,
} from "@/services/whatsapp";
import { getStoredUser } from "@/services/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import WhatsappChatSearch from "./WhatsappChatSearch";
import WhatsappConversationViewer from "./WhatsappConversationViewer";
import sectionStyles from "@/components/ProjectDetail/ProjectDetailSection.module.css";
import styles from "./WhatsappLinks.module.css";

export default function ClientWhatsappLinks({ clientId }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const data = await listClientWhatsappLinks(clientId);
      setLinks(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar números vinculados.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSelect(item) {
    if (!canEdit || adding) return;

    setAdding(true);
    try {
      await addClientWhatsappLink(clientId, {
        phone: item.phone_digits || item.external_id,
        phone_e164: item.phone_e164,
        whatsapp_jid: item.jid,
        label: item.name || null,
        is_primary: links.length === 0,
      });
      showSuccessToast("Número vinculado ao cliente.");
      await load();
    } catch (error) {
      showErrorToast(error.message || "Não foi possível vincular o número.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(linkId) {
    if (!canEdit || removingId) return;

    setRemovingId(linkId);
    try {
      await removeClientWhatsappLink(clientId, linkId);
      showSuccessToast("Vínculo removido.");
      await load();
    } catch (error) {
      showErrorToast(error.message || "Não foi possível remover o vínculo.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className={`${sectionStyles.card} ${styles.section}`}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>WhatsApp</h2>
          <p className={sectionStyles.cardHint}>
            Vincule o número do cliente para o Bordie e o RAG reconhecerem as conversas.
          </p>
        </div>
      </div>

      {loading ? (
        <p className={sectionStyles.empty}>Carregando números…</p>
      ) : links.length === 0 ? (
        <p className={sectionStyles.empty}>Nenhum número vinculado ainda.</p>
      ) : (
        <ul className={styles.linkedList}>
          {links.map((link) => (
            <li key={link.id} className={styles.linkedItem}>
              <div className={styles.linkedMain}>
                <strong>{formatWhatsappPhone(link.phone_digits)}</strong>
                {link.label && <small>{link.label}</small>}
                {link.is_primary && <span className={styles.badgePrimary}>Principal</span>}
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removingId === link.id}
                  onClick={() => handleRemove(link.id)}
                >
                  {removingId === link.id ? "Removendo…" : "Remover"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className={styles.searchBlock}>
          <p className={styles.searchLabel}>Buscar e vincular número</p>
          <WhatsappChatSearch
            mode="phone"
            placeholder="Nome ou número — Enter para buscar"
            disabled={adding}
            onSelect={handleSelect}
          />
        </div>
      )}

      <WhatsappConversationViewer clientId={clientId} />
    </section>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import Tab from "@/components/Tab/Tab";
import {
  addProjectWhatsappLink,
  formatWhatsappPhone,
  listProjectWhatsappLinks,
  removeProjectWhatsappLink,
} from "@/api/whatsapp";
import { getStoredUser } from "@/api/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import WhatsappChatSearch from "@/components/Whatsapp/WhatsappChatSearch";
import WhatsappConversationViewer from "@/components/Whatsapp/WhatsappConversationViewer";
import sectionStyles from "../ProjectDetailSection.module.css";
import linkStyles from "@/components/Whatsapp/WhatsappLinks.module.css";

function isInherited(link) {
  return Boolean(link.metadata?.inherited_from_client);
}

export default function ProjectWhatsappSection({ projectId }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [searchMode, setSearchMode] = useState("phone");

  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);

  const phoneLinks = links.filter((link) => link.link_type === "phone");
  const groupLinks = links.filter((link) => link.link_type === "group");

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await listProjectWhatsappLinks(projectId);
      setLinks(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar vínculos WhatsApp.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSelect(item) {
    if (!canEdit || adding) return;

    setAdding(true);
    try {
      if (item.type === "group") {
        await addProjectWhatsappLink(projectId, {
          link_type: "group",
          external_id: item.external_id,
          whatsapp_jid: item.jid,
          display_name: item.name || item.display,
        });
      } else {
        await addProjectWhatsappLink(projectId, {
          link_type: "phone",
          phone: item.phone_digits || item.external_id,
          whatsapp_jid: item.jid,
          display_name: item.name || formatWhatsappPhone(item.phone_digits),
        });
      }
      showSuccessToast("Vínculo adicionado ao projeto.");
      await load();
    } catch (error) {
      showErrorToast(error.message || "Não foi possível vincular.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(linkId) {
    if (!canEdit || removingId) return;

    setRemovingId(linkId);
    try {
      await removeProjectWhatsappLink(projectId, linkId);
      showSuccessToast("Vínculo removido.");
      await load();
    } catch (error) {
      showErrorToast(error.message || "Não foi possível remover o vínculo.");
    } finally {
      setRemovingId(null);
    }
  }

  function renderLinkList(items, emptyLabel) {
    if (loading) {
      return <p className={sectionStyles.empty}>Carregando…</p>;
    }

    if (items.length === 0) {
      return <p className={sectionStyles.empty}>{emptyLabel}</p>;
    }

    return (
      <ul className={linkStyles.linkedList}>
        {items.map((link) => (
          <li key={link.id} className={linkStyles.linkedItem}>
            <div className={linkStyles.linkedMain}>
              {link.link_type === "group" ? (
                <>
                  <strong>{link.display_name || "Grupo WhatsApp"}</strong>
                  <small>Grupo · {link.external_id}</small>
                </>
              ) : (
                <>
                  <strong>{formatWhatsappPhone(link.external_id)}</strong>
                  {link.display_name && link.display_name !== link.external_id && (
                    <small>{link.display_name}</small>
                  )}
                </>
              )}
              {isInherited(link) && (
                <span className={linkStyles.badgeInherited}>Do cliente</span>
              )}
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
    );
  }

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>WhatsApp do projeto</h2>
          <p className={sectionStyles.cardHint}>
            Números e grupos vinculados para contexto do Bordie e ingestão no RAG.
            O número principal do cliente é adicionado automaticamente.
          </p>
        </div>
      </div>

      <div className={linkStyles.subsection}>
        <h3 className={linkStyles.subTitle}>Números</h3>
        {renderLinkList(phoneLinks, "Nenhum número vinculado.")}
      </div>

      <div className={linkStyles.subsection}>
        <h3 className={linkStyles.subTitle}>Grupos</h3>
        {renderLinkList(groupLinks, "Nenhum grupo vinculado.")}
      </div>

      {canEdit && (
        <div className={linkStyles.searchBlock}>
          <nav className={linkStyles.searchTabs} role="tablist" aria-label="Tipo de vínculo">
            <Tab
              label="Número"
              active={searchMode === "phone"}
              onClick={() => setSearchMode("phone")}
            />
            <Tab
              label="Grupo"
              active={searchMode === "group"}
              onClick={() => setSearchMode("group")}
            />
          </nav>
          <WhatsappChatSearch
            mode={searchMode}
            placeholder={
              searchMode === "group"
                ? "Nome do grupo — Enter para buscar"
                : "Nome ou número — Enter para buscar"
            }
            disabled={adding}
            onSelect={handleSelect}
          />
        </div>
      )}

      <WhatsappConversationViewer projectId={projectId} />
    </section>
  );
}

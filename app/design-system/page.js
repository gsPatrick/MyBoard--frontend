"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar/Avatar";
import AvatarGroup from "@/components/AvatarGroup/AvatarGroup";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Card, { CardBody, CardHeader } from "@/components/Card/Card";
import Checkbox from "@/components/Checkbox/Checkbox";
import Chip from "@/components/Chip/Chip";
import Divider from "@/components/Divider/Divider";
import Input from "@/components/Input/Input";
import Modal, { ModalActions } from "@/components/Modal/Modal";
import Radio from "@/components/Radio/Radio";
import SearchInput from "@/components/SearchInput/SearchInput";
import StatusStrip from "@/components/StatusStrip/StatusStrip";
import Tab from "@/components/Tab/Tab";
import Text from "@/components/Text/Text";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
import styles from "./page.module.css";

function PlusIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="4" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

const TABS = ["Overview", "Targets", "Budget", "Users", "Files"];

const AVATARS = [
  { name: "Natali Craig" },
  { name: "Drew Cano" },
  { name: "Andi Lane" },
  { name: "Koray Okumus" },
  { name: "Kate Morrison" },
];

export default function DesignSystemPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("Overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [radioValue, setRadioValue] = useState("light");
  const [checked, setChecked] = useState(true);

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logoMark}>❄</span>
          <div>
            <Text variant="h3" as="h1">SnowUI</Text>
            <Text variant="caption" muted>Design System · Atomic Components</Text>
          </div>
        </div>
        <div className={styles.headerActions}>
          <SearchInput />
          <ThemeToggle />
          <Badge variant="indigo" dot>Tema: {theme}</Badge>
        </div>
      </header>

      <section className={styles.hero}>
        <Text variant="h1" as="h2" className={styles.gradientTitle}>
          snow DESIGN SYSTEM
        </Text>
        <Text variant="body" muted className={styles.heroText}>
          Componentes atômicos extraídos do Figma SnowUI, com suporte completo a tema claro e escuro.
          Prontos para montar as telas do dashboard.
        </Text>
      </section>

      <nav className={styles.tabs} role="tablist">
        {TABS.map((tab) => (
          <Tab
            key={tab}
            label={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </nav>

      <div className={styles.grid}>
        <Card variant="elevated" padding="lg" className={styles.section}>
          <CardHeader title="Buttons" subtitle="Variantes secondary, primary, ghost, outline" />
          <CardBody>
            <div className={styles.row}>
              <Button variant="secondary" icon={<PlusIcon />}>Add User</Button>
              <Button variant="secondary">Add Target</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary" icon={<DotsIcon />} />
            </div>
            <div className={styles.row}>
              <Button variant="secondary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="secondary" disabled>Disabled</Button>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated" padding="lg" className={styles.section}>
          <CardHeader title="Inputs" subtitle="Campo de texto e busca com atalho" />
          <CardBody>
            <Input label="Email" placeholder="seu@email.com" hint="Digite seu email corporativo" />
            <SearchInput placeholder="Search" />
          </CardBody>
        </Card>

        <Card variant="elevated" padding="lg" className={styles.section}>
          <CardHeader title="Badges & Chips" subtitle="Status e indicadores" />
          <CardBody>
            <div className={styles.row}>
              <Badge variant="indigo" dot>In Progress</Badge>
              <Badge variant="green" dot>Complete</Badge>
              <Badge variant="blue" dot>Pending</Badge>
              <Badge variant="orange" dot>Approved</Badge>
              <Badge variant="red" dot>Rejected</Badge>
            </div>
            <Divider />
            <div className={styles.row}>
              <Chip status="in-progress">In Progress</Chip>
              <Chip status="complete">Complete</Chip>
              <Chip status="pending">Pending</Chip>
              <Chip status="approved">Approved</Chip>
              <Chip status="rejected">Rejected</Chip>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated" padding="lg" className={styles.section}>
          <CardHeader title="Avatars" subtitle="Individual e grupo sobreposto" />
          <CardBody>
            <div className={styles.row}>
              <Avatar name="ByeWind" size="lg" />
              <Avatar name="Natali Craig" size="md" />
              <Avatar name="Drew Cano" size="sm" />
            </div>
            <AvatarGroup avatars={AVATARS} max={4} size="md" />
          </CardBody>
        </Card>

        <Card variant="elevated" padding="lg" className={styles.section}>
          <CardHeader title="Status Strip" subtitle="Barra de progresso do projeto" />
          <CardBody>
            <StatusStrip label="Status" progress={51} />
          </CardBody>
        </Card>

        <Card variant="elevated" padding="lg" className={styles.section}>
          <CardHeader title="Form Controls" subtitle="Radio e Checkbox" />
          <CardBody>
            <div className={styles.column}>
              <Radio
                name="theme-select"
                value="light"
                label="SnowUI Light"
                checked={radioValue === "light"}
                onChange={() => setRadioValue("light")}
              />
              <Radio
                name="theme-select"
                value="dark"
                label="SnowUI Dark"
                checked={radioValue === "dark"}
                onChange={() => setRadioValue("dark")}
              />
              <Checkbox
                label="Receber notificações"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated" padding="lg" className={`${styles.section} ${styles.full}`}>
          <CardHeader
            title="Modal"
            subtitle="Overlay com backdrop blur"
            action={
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                Abrir Modal
              </Button>
            }
          />
          <CardBody>
            <Text variant="body" muted>
              Clique no botão acima para visualizar o componente Modal com animação cinematográfica.
            </Text>
          </CardBody>
        </Card>

        <Card variant="default" padding="lg" className={`${styles.section} ${styles.full}`}>
          <CardHeader title="Color Tokens" subtitle={`Tema ativo: ${theme}`} />
          <CardBody>
            <div className={styles.colorGrid}>
              <div className={styles.colorSwatch} data-token="primary" />
              <div className={styles.colorSwatch} data-token="indigo" />
              <div className={styles.colorSwatch} data-token="purple" />
              <div className={styles.colorSwatch} data-token="green" />
              <div className={styles.colorSwatch} data-token="blue" />
              <div className={styles.colorSwatch} data-token="orange" />
              <div className={styles.colorSwatch} data-token="bg1" />
              <div className={styles.colorSwatch} data-token="bg2" />
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirmar ação"
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onConfirm={() => setModalOpen(false)}
            confirmLabel="Confirmar"
          />
        }
      >
        Este modal segue o padrão SnowUI com overlay, blur e animação suave.
        Pronto para ser reutilizado em qualquer tela do dashboard.
      </Modal>
    </div>
  );
}

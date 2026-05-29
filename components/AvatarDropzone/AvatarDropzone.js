"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AvatarDropzone.module.css";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28" aria-hidden="true">
      <path
        d="M12 16V8M12 8L9 11M12 8l3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 16v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AvatarDropzone({
  label = "Foto do cliente",
  file,
  onFileChange,
  disabled = false,
  previewName = "",
  existingPreviewUrl = null,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setPreviewUrl(existingPreviewUrl || null);
    return undefined;
  }, [file, existingPreviewUrl]);

  function validateAndSet(selectedFile) {
    setLocalError("");
    if (!selectedFile) {
      onFileChange(null);
      return;
    }

    if (!IMAGE_TYPES.includes(selectedFile.type)) {
      setLocalError("Use JPG, PNG, WebP ou GIF");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setLocalError("Imagem até 5 MB");
      return;
    }

    onFileChange(selectedFile);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0];
    validateAndSet(dropped);
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragging(false);
  }

  function handleInputChange(event) {
    validateAndSet(event.target.files?.[0] || null);
    event.target.value = "";
  }

  function handleRemove(event) {
    event.stopPropagation();
    onFileChange(null);
    setLocalError("");
  }

  const initials = previewName
    ? previewName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}

      <div
        className={[
          styles.zone,
          dragging && styles.zoneDragging,
          disabled && styles.zoneDisabled,
          (previewUrl || file || existingPreviewUrl) && styles.zoneHasPreview,
        ]
          .filter(Boolean)
          .join(" ")}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className={styles.hiddenInput}
          disabled={disabled}
          onChange={handleInputChange}
        />

        {previewUrl ? (
          <div className={styles.previewWrap}>
            <img src={previewUrl} alt="" className={styles.preview} />
            <p className={styles.hint}>Clique ou arraste para trocar</p>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={handleRemove}
              disabled={disabled}
            >
              Remover foto
            </button>
          </div>
        ) : (
          <>
            <span className={styles.previewPlaceholder}>{initials}</span>
            <span className={styles.icon}>
              <UploadIcon />
            </span>
            <p className={styles.text}>Arraste a foto aqui</p>
            <p className={styles.hint}>ou clique para escolher</p>
          </>
        )}
      </div>

      {localError && <p className={styles.error}>{localError}</p>}
    </div>
  );
}

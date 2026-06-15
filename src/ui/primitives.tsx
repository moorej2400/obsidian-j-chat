/**
 * Shared, reusable UI primitives for the J Chat side-panel UI.
 *
 * These are the small building blocks (toggles, section labels, sub-page
 * headers, card rows, etc.) that appear across multiple screens. Each
 * component here is presentational only — all state is passed in via props
 * so screens can compose them freely.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight, type LucideProps } from "@/ui/icons";

// ─────────────────────────────────────────────────────────────────────────
// Toggle — pill switch matching the mock's 40×23 toggle
// ─────────────────────────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  title
}: {
  checked: boolean;
  onChange: () => void;
  title?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      className="j-chat-toggle"
      title={title}
      aria-pressed={checked}
      onClick={onChange}
      style={{ background: checked ? "var(--accent)" : "var(--border2)" }}
    >
      <span
        className="j-chat-toggle-knob"
        style={{ left: checked ? "19px" : "2px" }}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SubPageHeader — back arrow + title + optional action button
// ─────────────────────────────────────────────────────────────────────────

export function SubPageHeader({
  title,
  onBack,
  actionLabel,
  onAction,
  actionVariant = "primary",
  actionIcon
}: {
  title: string;
  onBack: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "primary" | "outline";
  actionIcon?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="j-chat-sub-header">
      <button type="button" className="j-chat-back-btn" onClick={onBack} title="Back" aria-label="Back">
        <IconChevronLeft width={18} height={18} />
      </button>
      <span className="j-chat-sub-title">{title}</span>
      {actionLabel && onAction ? (
        actionVariant === "primary" ? (
          <button type="button" className="j-chat-btn-primary" onClick={onAction}>
            {actionIcon}
            {actionLabel}
          </button>
        ) : (
          <button type="button" className="j-chat-btn-outline" onClick={onAction}>
            {actionIcon}
            {actionLabel}
          </button>
        )
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SectionLabel — uppercase monospace label above a group
// ─────────────────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }): JSX.Element {
  return <div className="j-chat-section-label">{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────
// Card — a bordered rounded container for grouped rows
// ─────────────────────────────────────────────────────────────────────────

export function Card({ children, className }: { children: React.ReactNode; className?: string }): JSX.Element {
  return <div className={cn("j-chat-card", className)}>{children}</div>;
}

/**
 * CardRow — a single row inside a Card with optional icon, label, value,
 * and chevron. Clickable when onClick is provided.
 */
export function CardRow({
  icon,
  iconTint = "var(--accent-tint)",
  iconColor = "var(--text2)",
  label,
  value,
  onClick,
  showChevron = true,
  trailing
}: {
  icon?: React.ReactNode;
  iconTint?: string;
  iconColor?: string;
  label: string;
  value?: string;
  onClick?: () => void;
  showChevron?: boolean;
  trailing?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="j-chat-card-row" onClick={onClick} role={onClick ? "button" : undefined}>
      {icon ? (
        <span
          className="j-chat-card-row-icon"
          style={{ background: iconTint, color: iconColor }}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <span className="j-chat-card-row-label">{label}</span>
      {value ? <span className="j-chat-card-row-value">{value}</span> : null}
      {trailing}
      {showChevron && onClick ? (
        <IconChevronRight width={13} height={13} style={{ color: "var(--dim)" }} />
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RadioCard — selectable card with a radio dot (used in edit-behavior screen)
// ─────────────────────────────────────────────────────────────────────────

export function RadioCard({
  selected,
  onClick,
  title,
  description,
  badge
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  badge?: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      className={cn("j-chat-radio-card", selected && "is-selected")}
      onClick={onClick}
    >
      <span className="j-chat-radio-dot">
        {selected ? <span className="j-chat-radio-dot-inner" /> : null}
      </span>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-[var(--text)]">
          {title}
          {badge ? <span className="ml-2 align-middle">{badge}</span> : null}
        </div>
        <div className="mt-0.5 text-[11px] leading-[1.45] text-[var(--faint)]">{description}</div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TextInput — styled text input matching the mock
// ─────────────────────────────────────────────────────────────────────────

export function TextInput({
  value,
  onChange,
  placeholder,
  mono = false,
  type = "text"
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: "text" | "password";
}): JSX.Element {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("j-chat-input", mono && "j-chat-input-mono")}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Label — field label
// ─────────────────────────────────────────────────────────────────────────

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }): JSX.Element {
  return (
    <label className="j-chat-label">
      {children}
      {hint ? <span className="text-[var(--dim)]"> · {hint}</span> : null}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RangeSlider — styled range input
// ─────────────────────────────────────────────────────────────────────────

export function RangeSlider({
  min,
  max,
  step,
  value,
  onChange
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}): JSX.Element {
  return (
    <input
      type="range"
      className="j-chat-range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ToggleRow — a row with label + description on the left, Toggle on the right
// ─────────────────────────────────────────────────────────────────────────

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
  iconTint = "var(--accent-tint)",
  iconColor = "var(--accent-text)"
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
  iconTint?: string;
  iconColor?: string;
}): JSX.Element {
  return (
    <div className="j-chat-card-row" style={{ cursor: "default" }}>
      {icon ? (
        <span
          className="j-chat-card-row-icon"
          style={{ background: iconTint, color: iconColor }}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-[var(--text2)]">{label}</div>
        {description ? (
          <div className="text-[10.5px] text-[var(--faint)]">{description}</div>
        ) : null}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BadgePill — small monospace pill (e.g. "BETA", model names, counts)
// ─────────────────────────────────────────────────────────────────────────

export function BadgePill({
  children,
  variant = "muted"
}: {
  children: React.ReactNode;
  variant?: "muted" | "accent" | "ok" | "danger";
}): JSX.Element {
  const bg = {
    muted: "var(--chip)",
    accent: "var(--accent-tint)",
    ok: "var(--ok-tint)",
    danger: "var(--err-bg)"
  }[variant];
  const color = {
    muted: "var(--mid)",
    accent: "var(--accent-text)",
    ok: "var(--ok)",
    danger: "var(--err-title)"
  }[variant];
  return (
    <span
      className="j-chat-mono"
      style={{
        fontSize: "9.5px",
        fontWeight: 600,
        background: bg,
        color,
        padding: "1px 5px",
        borderRadius: 5,
        letterSpacing: "0.04em",
        border: variant === "danger" ? "1px solid var(--err-bd)" : "1px solid transparent"
      }}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// StatusDot — small colored dot for provider status
// ─────────────────────────────────────────────────────────────────────────

export function StatusDot({ color }: { color: string }): JSX.Element {
  return (
    <span
      style={{ width: 6, height: 6, borderRadius: "50%", background: color, flex: "none" }}
      aria-hidden
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// IconButtonSmall — smaller icon button for inline use (message actions etc.)
// ─────────────────────────────────────────────────────────────────────────

export function IconButtonSmall({
  icon: Icon,
  size = 14,
  title,
  onClick
}: {
  icon: React.ComponentType<LucideProps>;
  size?: number;
  title: string;
  onClick?: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      className="j-chat-msg-action-btn"
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      <Icon width={size} height={size} />
    </button>
  );
}

/**
 * IconButtonWide — message action button with text + icon (e.g. "Insert")
 */
export function IconButtonWide({
  icon: Icon,
  size = 13,
  label,
  title,
  onClick
}: {
  icon: React.ComponentType<LucideProps>;
  size?: number;
  label: string;
  title: string;
  onClick?: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      className="j-chat-msg-action-btn j-chat-msg-action-wide"
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      <Icon width={size} height={size} />
      <span>{label}</span>
    </button>
  );
}
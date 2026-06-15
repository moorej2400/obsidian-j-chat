/**
 * Centralized icon set for J Chat UI.
 *
 * These are thin wrappers around lucide-react icons, chosen to match the
 * J Chat v3 design mock (docs/J-Chat-v3-mock.html). Centralizing them here
 * makes it easy to swap individual icons without touching every screen.
 *
 * All icons accept standard SVG props via lucide's interface and default
 * to the sizes used in the mock (width/height props on each usage site).
 */

import {
  // Navigation / chrome
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Menu,
  Search,
  Settings as SettingsIcon,

  // Chat / composer
  ArrowUp,
  Paperclip,
  Zap,
  Send,

  // Message actions
  Copy,
  RotateCcw,
  Trash2,
  MoreHorizontal,

  // Thinking / tools
  Brain,
  Wrench,
  Check,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  Loader2,

  // Context / files
  FileText,
  FolderOpen,
  Link2,
  ScanSearch,

  // Skills
  Sparkles,

  // Sessions
  Bookmark,
  Star,

  // Settings groups
  Gem,
  Eye,
  Database,
  Shield,
  Keyboard,
  Palette,
  Moon,
  CircleHelp,

  // Providers
  KeyRound,
  Plug,

  // Misc
  Download,
  PencilLine,
  FileUp,
  ClipboardPaste,
  ExternalLink,
  Maximize2,
  type LucideProps
} from "lucide-react";

import * as React from "react";

// ---- Navigation / chrome ----
export const IconChevronDown = ChevronDown;
export const IconChevronLeft = ChevronLeft;
export const IconChevronRight = ChevronRight;
export const IconPlus = Plus;
export const IconX = X;
export const IconMenu = Menu;
export const IconSearch = Search;
export const IconSettings = SettingsIcon;

// ---- Chat / composer ----
export const IconArrowUp = ArrowUp;
export const IconAttach = Paperclip;
export const IconSkill = Zap;
export const IconSend = Send;

// ---- Message actions ----
export const IconCopy = Copy;
export const IconRegenerate = RotateCcw;
export const IconTrash = Trash2;
export const IconMore = MoreHorizontal;

// ---- Thinking / tools ----
export const IconBrain = Brain;
export const IconWrench = Wrench;
export const IconCheck = Check;
export const IconCheckCircle = CheckCircle2;
export const IconCircleDot = CircleDot;
export const IconAlertCircle = AlertCircle;
export const IconLoader = Loader2;

// ---- Context / files ----
export const IconFile = FileText;
export const IconFolder = FolderOpen;
export const IconLink = Link2;
export const IconSearchVault = ScanSearch;

// ---- Skills ----
export const IconSparkles = Sparkles;

// ---- Sessions ----
export const IconBookmark = Bookmark;
export const IconStar = Star;

// ---- Settings groups ----
export const IconDefaultModel = Gem;
export const IconModes = CircleDot;
export const IconSkills = Zap;
export const IconStyles = PencilLine;
export const IconSystemPrompt = Keyboard;
export const IconContextRetrieval = ScanSearch;
export const IconEditBehavior = CheckCircle2;
export const IconDataPrivacy = Shield;
export const IconKeyboard = Keyboard;
export const IconPalette = Palette;
export const IconMoon = Moon;
export const IconDatabase = Database;

// ---- Providers ----
export const IconKey = KeyRound;
export const IconPlug = Plug;
// Github brand icon is not in lucide-react; use a simple inline SVG fallback.
export const IconGithub = ({ width = 24, height = 24, ...rest }: LucideProps) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="currentColor" {...rest}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

// ---- Misc ----
export const IconDownload = Download;
export const IconPencil = PencilLine;
export const IconFileUp = FileUp;
export const IconClipboard = ClipboardPaste;
export const IconCircleHelp = CircleHelp;
export const IconExternalLink = ExternalLink;
export const IconMaximize = Maximize2;

// ---- Re-export LucideProps for convenience ----
export type { LucideProps };

/**
 * Helper: render an icon at a fixed pixel size with currentColor stroke.
 * Matches the mock's inline SVG sizing convention.
 */
export function iconSize(size: number): { width: number; height: number } {
  return { width: size, height: size };
}

/**
 * Generic icon button used in headers, message actions, tool rows, etc.
 * Renders a borderless, hover-tinted square button containing a single icon.
 */
export function IconButton({
  icon: Icon,
  size = 17,
  title,
  onClick,
  className
}: {
  icon: React.ComponentType<LucideProps>;
  size?: number;
  title?: string;
  onClick?: () => void;
  className?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      className={`j-chat-icon-btn ${className ?? ""}`}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      <Icon {...iconSize(size)} />
    </button>
  );
}
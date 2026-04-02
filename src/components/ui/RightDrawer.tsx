import { useEffect, type ReactNode, type MouseEvent } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export default function RightDrawer({
  open,
  title,
  onClose,
  children,
  footer,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const onBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="right-drawer-backdrop" onClick={onBackdropClick}>
      <aside
        className="right-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="right-drawer-header">
          <button
            type="button"
            className="right-drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ×
          </button>
          <div className="right-drawer-divider" />
          <h2>{title}</h2>
        </div>

        <div className="right-drawer-body">{children}</div>

        {footer ? <div className="right-drawer-footer">{footer}</div> : null}
      </aside>
    </div>
  );
}
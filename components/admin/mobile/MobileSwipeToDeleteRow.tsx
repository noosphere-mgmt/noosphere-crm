"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconTrash } from "@/components/admin/ModuleActionIcons";

const ACTION_WIDTH = 88;
const OPEN_THRESHOLD = 44;

type SwipeGroupContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const MobileSwipeDeleteGroupContext = createContext<SwipeGroupContextValue | null>(null);

export function MobileSwipeDeleteGroup({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <MobileSwipeDeleteGroupContext.Provider value={{ openId, setOpenId }}>
      {children}
    </MobileSwipeDeleteGroupContext.Provider>
  );
}

export function MobileSwipeToDeleteRow({
  rowId,
  children,
  onDelete,
  deleteLabel = "Delete",
  disabled = false,
  className = "",
}: {
  rowId: string;
  children: ReactNode;
  onDelete: () => void | Promise<void>;
  deleteLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const group = useContext(MobileSwipeDeleteGroupContext);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const axisLocked = useRef<"x" | "y" | null>(null);

  const snap = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      setOffset(nextOpen ? -ACTION_WIDTH : 0);
      if (group) {
        group.setOpenId(nextOpen ? rowId : group.openId === rowId ? null : group.openId);
      }
    },
    [group, rowId],
  );

  useEffect(() => {
    if (group && group.openId !== rowId && open) {
      setOpen(false);
      setOffset(0);
    }
  }, [group, group?.openId, open, rowId]);

  const onTouchStart = (event: React.TouchEvent) => {
    if (disabled) return;
    const touch = event.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startOffset.current = open ? -ACTION_WIDTH : 0;
    axisLocked.current = null;
    setIsDragging(true);
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    const touch = event.touches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    if (!axisLocked.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (axisLocked.current === "y") return;

    const next = Math.max(-ACTION_WIDTH, Math.min(0, startOffset.current + dx));
    setOffset(next);
  };

  const onTouchEnd = () => {
    if (axisLocked.current === "x") {
      snap(offset < -OPEN_THRESHOLD);
    }
    axisLocked.current = null;
    setIsDragging(false);
  };

  async function handleDeleteClick() {
    snap(false);
    await onDelete();
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width: ACTION_WIDTH }}
        aria-hidden={!open && offset === 0}
      >
        <button
          type="button"
          onClick={() => void handleDeleteClick()}
          disabled={disabled}
          className="flex w-full flex-col items-center justify-center gap-0.5 bg-red-600 px-2 text-xs font-semibold text-white active:bg-red-700 disabled:opacity-60"
          aria-label={deleteLabel}
        >
          <IconTrash className="h-4 w-4" />
          Delete
        </button>
      </div>
      <div
        className="relative bg-white touch-pan-y"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? "none" : "transform 200ms ease-out",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

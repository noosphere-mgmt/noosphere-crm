"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ADMIN_MOBILE_MAX_PX } from "@/lib/adminViewport";
import { AdminListLoadingFallback } from "@/components/admin/layout/AdminListLoadingFallback";

/**
 * Renders exactly one presentation tree (mobile OR desktop).
 * Avoids mounting both trees — previously both hydrated and ran hooks while CSS hid one.
 */
export function AdminViewportSwitch({
  mobile,
  desktop,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${ADMIN_MOBILE_MAX_PX}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    setReady(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!ready) {
    return <AdminListLoadingFallback />;
  }

  return isMobile ? mobile : desktop;
}

export function AdminMobileOnly({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${ADMIN_MOBILE_MAX_PX}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    setReady(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!ready || !isMobile) return null;
  return children;
}

export function AdminDesktopOnly({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${ADMIN_MOBILE_MAX_PX}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    setReady(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!ready || isMobile) return null;
  return children;
}

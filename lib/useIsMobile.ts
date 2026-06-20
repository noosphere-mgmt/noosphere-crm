"use client";

import { useEffect, useState } from "react";
import { ADMIN_MOBILE_MAX_PX } from "@/lib/adminViewport";

/** True when viewport width ≤ {@link ADMIN_MOBILE_MAX_PX} (mobile band). Tablet/desktop use separate presentation trees. */
export function useIsMobile(maxWidth = ADMIN_MOBILE_MAX_PX): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [maxWidth]);

  return isMobile;
}

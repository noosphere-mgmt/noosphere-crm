"use client";

import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";

export function ConnectionsContactsListHeaderMobile({ onNewContact }: { onNewContact: () => void }) {
  return <ConnectionsModuleToolbar onCreate={onNewContact} createLabel="New contact" />;
}

import { AdminShell } from "@/components/admin/AdminShell";
import { ChannelTreeClient } from "@/components/admin/connections/ChannelTreeClient";
import { getChannelTreeData } from "@/lib/repos/channelTree";
import { listContacts } from "@/lib/repos/contacts";

export const dynamic = "force-dynamic";

export default async function ChannelTreePage() {
  const [contacts, tree] = await Promise.all([listContacts(), getChannelTreeData()]);
  return (
    <AdminShell title="Connections" module="connections" wide hideHeader>
      <ChannelTreeClient contacts={contacts} tree={tree} />
    </AdminShell>
  );
}

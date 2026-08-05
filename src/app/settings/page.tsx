import { SettingsForm } from "@/app/settings/settings-form";
import { CrmShell } from "@/components/crm-shell";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <CrmShell title="Settings" eyebrow="Account and security">
      <SettingsForm user={{ name: user.name, email: user.email, role: user.role }} />
    </CrmShell>
  );
}

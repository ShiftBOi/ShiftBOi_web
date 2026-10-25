"use client";

import {
  UserMenu,
  type ThemePreference,
} from "@/components/arc/user-menu/user-menu";
import { CmsAccountSettings } from "@/components/management/cms-account-settings";
import { useCmsTheme } from "@/components/management/cms-theme";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";

type SettingsTab = "account" | "passkeys" | "web";

export function CmsAccountMenu({
  user,
  onLogout,
  collapsed,
}: {
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
  onLogout: () => void | Promise<unknown>;
  collapsed?: boolean;
}) {
  const { preference, setPreference } = useCmsTheme();
  const [account, setAccount] = useState(user);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("account");

  useEffect(() => {
    setAccount(user);
  }, [user]);

  return (
    <div className="cms-account">
      <UserMenu
        user={{
          name: account.username,
          email: account.email,
          plan: "Admin",
          avatarSrc: account.avatarUrl || undefined,
        }}
        theme={preference as ThemePreference}
        onThemeChange={(next) => setPreference(next)}
        showTheme
        showName={!collapsed}
        stretch={!collapsed}
        align="start"
        portal
        items={[
          {
            label: "Settings",
            icon: <Settings size={16} strokeWidth={1.75} />,
            onSelect: () => {
              setSettingsTab("account");
              setSettingsOpen(true);
            },
            keys: ["⌘", ","],
          },
        ]}
        onSignOut={onLogout}
        className="cms-account__trigger"
      />
      <CmsAccountSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={account}
        initialTab={settingsTab}
        onUserUpdated={(next) => setAccount(next)}
      />
    </div>
  );
}

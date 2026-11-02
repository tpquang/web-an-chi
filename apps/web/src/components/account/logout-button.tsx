"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/account-client";
import { Button } from "../ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        await logout();
        router.replace("/");
        router.refresh();
      }}
    >
      Đăng xuất
    </Button>
  );
}

import { useAppUpdate } from "@/hooks/use-app-update";

export default function AppUpdateWatcher() {
  useAppUpdate({ intervalMs: 60_000 }); // 1 min
  return null;
}

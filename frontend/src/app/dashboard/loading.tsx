import { Activity } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
        <Activity className="h-5 w-5 text-white animate-pulse" />
      </div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

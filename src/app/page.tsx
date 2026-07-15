import { XhsMasterApp } from "@/app/components/XhsMasterApp";
import { AuthGuard } from "@/app/components/AuthGuard";

export default function Home() {
  return (
    <AuthGuard>
      <XhsMasterApp />
    </AuthGuard>
  );
}

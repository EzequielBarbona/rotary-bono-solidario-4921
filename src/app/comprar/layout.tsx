import { PurchaseProvider } from "@/lib/purchase-context";

export default function ComprarLayout({ children }: { children: React.ReactNode }) {
  return <PurchaseProvider>{children}</PurchaseProvider>;
}

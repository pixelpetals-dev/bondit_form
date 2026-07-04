import { StoreProvider } from "@/lib/store";
import { BrandHeader } from "@/components/chrome";

export default function FormLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="flex min-h-dvh flex-col bg-mist">
        <BrandHeader />
        {children}
      </div>
    </StoreProvider>
  );
}

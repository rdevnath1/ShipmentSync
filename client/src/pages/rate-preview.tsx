import Header from "@/components/header";
import RatePreview from "@/components/rate-preview";

export default function RatePreviewPage() {
  return (
    <>
      <Header 
        title="Rate Preview" 
        description="Get shipping cost estimates before creating orders"
      />
      <div className="p-4 lg:p-6">
        <RatePreview className="max-w-4xl mx-auto" />
      </div>
    </>
  );
}
import Header from "@/components/header";
import RatePreview from "@/components/rate-preview";

export default function RateCalculatorPage() {
  return (
    <>
      <Header 
        title="Rate Calculator" 
        description="Calculate shipping costs before creating orders"
      />
      <div className="p-4 lg:p-6">
        <RatePreview className="max-w-4xl mx-auto" />
      </div>
    </>
  );
}
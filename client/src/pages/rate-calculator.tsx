import Header from "@/components/header";
import RatePreview from "@/components/rate-preview";

export default function RateCalculatorPage() {
  return (
    <>
      <Header 
        title="Rate Calculator" 
        description="Calculate shipping costs before creating orders"
      />
      <div className="p-4 lg:p-6 ml-[0px] mr-[0px] mt-[0px] mb-[0px] pl-[16px] pr-[16px] pt-[27px] pb-[27px]">
        <RatePreview className="max-w-4xl mx-auto" />
      </div>
    </>
  );
}
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
      <LoadingSpinner message="Fetching Data..." size={56} />
    </div>
  );
}

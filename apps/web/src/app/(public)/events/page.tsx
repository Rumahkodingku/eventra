import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EventListing } from "@/features/discovery/event-listing";

function ListingFallback() {
  return (
    <div className="container-page section-space">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="mt-4 h-14 w-2/3" />
      <Skeleton className="mt-4 h-5 w-1/2" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {["one", "two", "three", "four", "five", "six"].map((key) => (
          <Skeleton key={key} className="aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ListingFallback />}>
      <EventListing />
    </Suspense>
  );
}

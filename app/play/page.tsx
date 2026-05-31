import { Suspense } from "react";
import { PlayContent } from "./PlayContent";

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <PlayContent />
    </Suspense>
  );
}

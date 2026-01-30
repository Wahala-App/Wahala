import Spinner from "./ui/spinner";

export default function Loading() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-8">
        <div className="flex items-center gap-3">
          <img
            src="/logo/wahala%20logo5.png"
            alt="Wahala logo"
            width={64}
            height={64}
            className="h-16 w-auto object-contain"
          />
          <div className="text-3xl font-black tracking-tighter leading-none text-foreground">WAHALA</div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Spinner size={50} borderWidth={5} />

          <div className="text-center">
            <p className="font-medium text-foreground">Loading Components...</p>
            <p className="text-sm text-foreground/60">
              This may take a moment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

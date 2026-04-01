const STEPS = ["Find", "Choose Cook", "Book", "Pay", "Confirmed"];

const StepProgress = ({ current }: { current: number }) => (
  <div className="px-6 py-3 bg-card border-b border-border">
    <div className="flex items-center justify-between max-w-[430px] mx-auto">
      {STEPS.map((label, i) => {
        const completed = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-col items-center flex-1 relative">
            {i > 0 && (
              <div
                className={`absolute top-[7px] right-1/2 w-full h-[2px] -translate-x-0 ${
                  completed ? "bg-primary/40" : "bg-border"
                }`}
                style={{ left: "-50%", width: "100%" }}
              />
            )}
            <div
              className={`w-[14px] h-[14px] rounded-full border-2 z-10 ${
                active
                  ? "border-primary bg-primary"
                  : completed
                  ? "border-primary/40 bg-primary/40"
                  : "border-border bg-muted"
              }`}
            />
            <span
              className={`font-body text-[9px] mt-1 ${
                active
                  ? "text-primary font-semibold"
                  : completed
                  ? "text-primary/60"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

export default StepProgress;

import { cn } from "@/lib/utils";

/** Предложение с пропуском «___». Если value задан — он показывается на месте пропуска. */
export function BlankSentence({
  text,
  value,
  state = "idle",
}: {
  text: string;
  value?: string;
  state?: "idle" | "correct" | "wrong";
}) {
  const parts = text.split("___");
  return (
    <span lang="en">
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 && (
            <span
              className={cn(
                "mx-1 inline-block min-w-16 border-b-4 px-1 text-center align-baseline",
                state === "idle" && (value ? "border-primary text-primary" : "border-primary/60"),
                state === "correct" && "border-success text-success",
                state === "wrong" && "border-destructive text-destructive",
              )}
            >
              {value || <span className="sr-only">пропуск</span>}
              {!value && " "}
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

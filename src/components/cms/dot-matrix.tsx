const DIGITS: Record<string, number[][]> = {
  "0": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  "1": [
    [0, 1, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  "2": [
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
  ],
  "3": [
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  "4": [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  "5": [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  "6": [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  "7": [
    [1, 1, 1],
    [0, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
  "8": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  "9": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
};

type DotMatrixNumberProps = {
  value: number | string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function DotMatrixNumber({
  value,
  size = "lg",
  className = "",
}: DotMatrixNumberProps) {
  const chars = String(value).split("");

  return (
    <span
      className={`cms-dotnum cms-dotnum-${size}${className ? ` ${className}` : ""}`}
      aria-label={String(value)}
    >
      {chars.map((ch, i) => {
        const grid = DIGITS[ch];
        if (!grid) {
          return (
            <span key={`${ch}-${i}`} className="cms-dotnum-gap" aria-hidden>
              {ch}
            </span>
          );
        }
        return (
          <span key={`${ch}-${i}`} className="cms-dotnum-digit" aria-hidden>
            {grid.flatMap((row, y) =>
              row.map((on, x) => (
                <i
                  key={`${y}-${x}`}
                  className={on ? "is-on" : undefined}
                  style={{ gridColumn: x + 1, gridRow: y + 1 }}
                />
              )),
            )}
          </span>
        );
      })}
    </span>
  );
}

type SparkBarsProps = {
  values?: number[];
  className?: string;
};

export function SparkBars({
  values = [0.35, 0.55, 0.4, 0.7, 0.5, 0.85, 0.62, 0.9, 0.48, 0.75, 0.58, 0.95],
  className = "",
}: SparkBarsProps) {
  return (
    <div
      className={`cms-spark-bars${className ? ` ${className}` : ""}`}
      aria-hidden
    >
      {values.map((v, i) => (
        <span key={i} className="cms-spark-col">
          {Array.from({ length: 6 }, (_, row) => {
            const threshold = (5 - row) / 6;
            return (
              <i key={row} className={v >= threshold ? "is-on" : undefined} />
            );
          })}
        </span>
      ))}
    </div>
  );
}

export function SparkWave({ className = "" }: { className?: string }) {
  const dots = Array.from({ length: 28 }, (_, i) => {
    const t = i / 27;
    const y = 0.5 + Math.sin(t * Math.PI * 2.2) * 0.38;
    return { y, left: `${(i / 27) * 100}%` };
  });

  return (
    <div className={`cms-spark-wave${className ? ` ${className}` : ""}`} aria-hidden>
      {dots.map((d, i) => (
        <i
          key={i}
          style={{
            ["--y" as string]: String(d.y),
            left: d.left,
          }}
        />
      ))}
    </div>
  );
}

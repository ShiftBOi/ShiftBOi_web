import { cn } from "cn";

/** ShiftBOi shift-stairs mark — matches `/public/brand/shiftboi-mark.svg`. */
export function CmsMark({
  className,
  title = "ShiftBOi",
}: {
  className?: string;
  title?: string;
}) {
  const labeled = Boolean(title);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("cms-mark", className)}
      aria-hidden={labeled ? undefined : true}
      role={labeled ? "img" : undefined}
    >
      {labeled ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M13.792,5.120 H27.168 Q29.760,5.120 29.760,7.712 V8.288 Q29.760,10.880 27.168,10.880 H13.792 Q11.200,10.880 11.200,8.288 V7.712 Q11.200,5.120 13.792,5.120 Z"
      />
      <path
        fill="currentColor"
        d="M9.312,13.600 H22.688 Q25.280,13.600 25.280,16.192 V16.768 Q25.280,19.360 22.688,19.360 H9.312 Q6.720,19.360 6.720,16.768 V16.192 Q6.720,13.600 9.312,13.600 Z"
      />
      <path
        fill="currentColor"
        d="M4.832,22.080 H18.208 Q20.800,22.080 20.800,24.672 V25.248 Q20.800,27.840 18.208,27.840 H4.832 Q2.240,27.840 2.240,25.248 V24.672 Q2.240,22.080 4.832,22.080 Z"
      />
    </svg>
  );
}

/* The hatch-plot portrait, used as an alpha mask over colour.
   `mondrian` paints it in flowing De Stijl colour; otherwise flat bone. */
export default function PortraitMark({
  size = 48,
  mondrian = false,
  className = "",
  style,
}: {
  size?: number;
  mondrian?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      role="img"
      aria-label="Ujjwal Agarwal"
      className={`portrait-mark ${mondrian ? "mondrian" : ""} ${className}`}
      style={{
        display: "block",
        width: size,
        height: size,
        ...style,
      }}
    />
  );
}

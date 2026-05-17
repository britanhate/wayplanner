export default function CalciteIcon({ name, size = 16 }) {
  const scale = size <= 16 ? "s" : size <= 20 ? "m" : "l";
  return (
    <calcite-icon
      icon={name}
      scale={scale}
      style={{ inlineSize: `${size}px`, blockSize: `${size}px`, color: "currentColor" }}
      aria-hidden="true"
    />
  );
}

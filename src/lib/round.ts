// C#'s Math.Round uses round-half-to-even ("banker's rounding") by default, whereas
// JavaScript's Math.round rounds halves up. The forecast score and the risk-geometry
// radius/angle both pass through Math.Round in the Atlas source, and a half-value can
// tip a risk band, so the port reproduces banker's rounding to stay bit-faithful.
export function roundHalfEven(value: number, digits = 0): number {
  const f = Math.pow(10, digits);
  const scaled = value * f;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  const EPS = 1e-9;
  let result: number;
  if (Math.abs(frac - 0.5) < EPS) {
    result = floor % 2 === 0 ? floor : floor + 1; // halfway → nearest even
  } else {
    result = Math.round(scaled);
  }
  return result / f;
}

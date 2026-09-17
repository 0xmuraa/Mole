export type Point = { x: number; y: number };

// Builds a quadratic bezier "tunnel" path between two points, bent
// perpendicular to the line between them so networks read as organic
// underground paths instead of straight corporate-graph spokes.
export function buildEdgePath(a: Point, b: Point, bend: number): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const cx = mx + px * bend;
  const cy = my + py * bend;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

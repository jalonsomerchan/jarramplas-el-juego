export function rectCircleHit(rect, circle) {
  const rx = rect.x - rect.w / 2;
  const ry = rect.y - rect.h;
  const cx = Math.max(rx, Math.min(circle.x, rx + rect.w));
  const cy = Math.max(ry, Math.min(circle.y, ry + rect.h));
  return Math.hypot(circle.x - cx, circle.y - cy) < circle.r * 0.8;
}

/**
 * @hello-pangea/dnd finishes a drop when the dragged element fires `transitionend`. The global reduced-motion rule
 * (`transition-duration: 0s !important`) means no transition runs, so with "reduce motion" on a drop would never complete.
 * A 1ms duration keeps the motion imperceptible but lets the event fire. Higher specificity than `*`, so it wins.
 */
export function DndMotionFix() {
  return (
    <style>{`
@media (prefers-reduced-motion: reduce) {
  [data-rfd-draggable-id],
  [data-rfd-placeholder-context-id] {
    transition-duration: 1ms !important;
  }
}`}</style>
  );
}

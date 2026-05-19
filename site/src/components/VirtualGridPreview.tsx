export function VirtualGridPreview() {
  return (
    <div className="grid-preview" aria-label="Responsive virtualized grid preview">
      {Array.from({ length: 18 }, (_, index) => (
        <div className="grid-preview-item" key={index}>
          <span>{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

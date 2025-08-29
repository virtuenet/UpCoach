export default function FileUploader({ onUpload }: any) {
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <input type="file" onChange={(e) => onUpload?.(e.target.files)} />
      <p className="mt-2 text-sm text-muted-foreground">Click to upload files</p>
    </div>
  );
}
export default function ColorPicker({ color, onChange }: any) {
  return (
    <input 
      type="color" 
      value={color} 
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full h-10 rounded border"
    />
  );
}
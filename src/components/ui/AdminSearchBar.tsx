type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function AdminSearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: Props) {
  return (
    <div className="pill-search">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <span className="pill-search-icon">⌕</span>
    </div>
  );
}
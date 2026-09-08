import { Select } from '@/components/ui/FormFields';

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-auto min-w-[160px]">
      <option value="featured">Featured</option>
      <option value="newest">Newest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="rating">Top Rated</option>
      <option value="popular">Most Popular</option>
    </Select>
  );
}

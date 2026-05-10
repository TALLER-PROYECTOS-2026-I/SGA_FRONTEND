import { Search, X } from "lucide-react";

interface SearchableSelectProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  onClear: () => void;
  items: T[];
  selectedItem: T | null;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  placeholder: string;
  renderItem: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string;
  noResultsText?: string;
}

export default function SearchableSelect<T>({
  value,
  onChange,
  onSelect,
  onClear,
  items,
  selectedItem,
  showDropdown,
  setShowDropdown,
  placeholder,
  renderItem,
  getItemKey,
  noResultsText = "No se encontraron resultados",
}: SearchableSelectProps<T>) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3 h-12 border border-gray-200 rounded-xl px-4 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent transition-all">
        <Search className="text-gray-400" size={20} />

        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="flex-1 outline-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400"
        />

        {selectedItem && (
          <button
            type="button"
            onClick={onClear}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showDropdown && value && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {items.length > 0 ? (
            items.map((item) => (
              <button
                type="button"
                key={getItemKey(item)}
                onClick={() => onSelect(item)}
                className="w-full text-left px-4 py-4 hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                {renderItem(item)}
              </button>
            ))
          ) : (
            <div className="px-4 py-5 text-center text-sm text-gray-500">
              {noResultsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
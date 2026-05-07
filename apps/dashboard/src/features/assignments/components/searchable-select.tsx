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
      {/* 
        AQUÍ SE EDITÓ: Se agregó focus-within:ring-2 focus-within:ring-purple-500 
        focus-within:border-transparent transition-colors para el efecto morado 
      */}
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-colors">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="flex-1 outline-none text-gray-700 bg-transparent"
        />
        <Search className="text-gray-400" size={20} />
        {selectedItem && (
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && value && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {items.length > 0 ? (
            items.map((item) => (
              <button
                key={getItemKey(item)}
                onClick={() => onSelect(item)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                {renderItem(item)}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500">{noResultsText}</div>
          )}
        </div>
      )}
    </div>
  );
}

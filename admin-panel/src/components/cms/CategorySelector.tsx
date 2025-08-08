import React, { useState, useEffect } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
}

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  useEffect(() => {
    // Fetch categories from API
    // Mock data for now
    setCategories([
      {
        id: "1",
        name: "Productivity",
        slug: "productivity",
        children: [
          {
            id: "11",
            name: "Time Management",
            slug: "time-management",
            parentId: "1",
          },
          {
            id: "12",
            name: "Focus & Concentration",
            slug: "focus-concentration",
            parentId: "1",
          },
        ],
      },
      {
        id: "2",
        name: "Wellness",
        slug: "wellness",
        children: [
          {
            id: "21",
            name: "Mental Health",
            slug: "mental-health",
            parentId: "2",
          },
          {
            id: "22",
            name: "Physical Health",
            slug: "physical-health",
            parentId: "2",
          },
        ],
      },
      { id: "3", name: "Leadership", slug: "leadership" },
      { id: "4", name: "Career Development", slug: "career-development" },
      { id: "5", name: "Personal Growth", slug: "personal-growth" },
    ]);
  }, []);

  useEffect(() => {
    if (value && categories.length > 0) {
      const findCategory = (cats: Category[]): Category | null => {
        for (const cat of cats) {
          if (cat.id === value) return cat;
          if (cat.children) {
            const found = findCategory(cat.children);
            if (found) return found;
          }
        }
        return null;
      };
      setSelectedCategory(findCategory(categories));
    }
  }, [value, categories]);

  const handleSelect = (category: Category) => {
    setSelectedCategory(category);
    onChange(category.id);
    setShowDropdown(false);
  };

  const renderCategory = (category: Category, level = 0) => (
    <div key={category.id}>
      <button
        onClick={() => handleSelect(category)}
        className={`
          w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2
          ${selectedCategory?.id === category.id ? "bg-blue-50 text-blue-600" : ""}
        `}
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        <FolderOpen className="w-4 h-4" />
        {category.name}
      </button>
      {category.children &&
        category.children.map((child) => renderCategory(child, level + 1))}
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400"
      >
        <span className="flex items-center gap-2">
          {selectedCategory ? (
            <>
              <FolderOpen className="w-4 h-4 text-gray-500" />
              {selectedCategory.name}
            </>
          ) : (
            <span className="text-gray-500">Select a category</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? "rotate-180" : ""}`}
        />
      </button>

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {categories.map((category) => renderCategory(category))}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;

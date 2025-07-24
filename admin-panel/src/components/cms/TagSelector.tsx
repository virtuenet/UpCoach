import React, { useState, useEffect, useRef } from 'react';
import { X, Tag } from 'lucide-react';

interface TagItem {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ value, onChange }) => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState<TagItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch tags from API
    // Mock data for now
    setTags([
      { id: '1', name: 'habits', color: '#10B981' },
      { id: '2', name: 'success', color: '#8B5CF6' },
      { id: '3', name: 'meditation', color: '#3B82F6' },
      { id: '4', name: 'mindfulness', color: '#6366F1' },
      { id: '5', name: 'goals', color: '#F59E0B' },
      { id: '6', name: 'planning', color: '#EF4444' },
      { id: '7', name: 'productivity', color: '#06B6D4' },
      { id: '8', name: 'wellness', color: '#84CC16' },
      { id: '9', name: 'leadership', color: '#EC4899' },
      { id: '10', name: 'motivation', color: '#F97316' }
    ]);
  }, []);

  useEffect(() => {
    const selected = tags.filter(tag => value.includes(tag.id));
    setSelectedTags(selected);
  }, [value, tags]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = tags.filter(
        tag => 
          tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !value.includes(tag.id)
      );
      setFilteredTags(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredTags(tags.filter(tag => !value.includes(tag.id)));
      setShowSuggestions(false);
    }
  }, [searchQuery, tags, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag: TagItem) => {
    onChange([...value, tag.id]);
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(value.filter(id => id !== tagId));
  };

  const handleCreateTag = () => {
    if (searchQuery && !tags.find(tag => tag.name === searchQuery)) {
      // In a real app, this would create a new tag via API
      const newTag: TagItem = {
        id: `new-${Date.now()}`,
        name: searchQuery,
        color: '#6B7280'
      };
      setTags([...tags, newTag]);
      handleAddTag(newTag);
    }
  };

  return (
    <div className="relative">
      <div className="border border-gray-300 rounded-lg p-2 min-h-[42px]">
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              <Tag className="w-3 h-3" />
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery) {
                e.preventDefault();
                if (filteredTags.length > 0) {
                  handleAddTag(filteredTags[0]);
                } else {
                  handleCreateTag();
                }
              }
            }}
            placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
            className="flex-1 min-w-[100px] outline-none text-sm"
          />
        </div>
      </div>

      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto"
        >
          {filteredTags.length > 0 ? (
            filteredTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleAddTag(tag)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            ))
          ) : searchQuery ? (
            <button
              onClick={handleCreateTag}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
            >
              <Tag className="w-4 h-4 text-gray-500" />
              Create "{searchQuery}"
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TagSelector;
// src/components/notes/TagFilter.tsx
import React from "react";
import { Tag } from "lucide-react";

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  selectedTags,
  onTagToggle,
}) => {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagToggle(tag)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
            selectedTags.includes(tag)
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <Tag size={16} />
          {tag}
        </button>
      ))}
    </div>
  );
};

export default TagFilter;

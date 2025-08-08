import React from "react";
import { Search, AlertCircle } from "lucide-react";

interface SEOSettingsProps {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  onChange: (seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  }) => void;
}

const SEOSettings: React.FC<SEOSettingsProps> = ({
  metaTitle = "",
  metaDescription = "",
  metaKeywords = "",
  onChange,
}) => {
  const titleLength = metaTitle.length;
  const descriptionLength = metaDescription.length;

  const getTitleStatus = () => {
    if (titleLength === 0) return "empty";
    if (titleLength < 30) return "short";
    if (titleLength > 60) return "long";
    return "good";
  };

  const getDescriptionStatus = () => {
    if (descriptionLength === 0) return "empty";
    if (descriptionLength < 120) return "short";
    if (descriptionLength > 160) return "long";
    return "good";
  };

  const titleStatus = getTitleStatus();
  const descriptionStatus = getDescriptionStatus();

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          SEO Settings
        </h2>
        <p className="text-sm text-gray-600">
          Optimize your content for search engines to improve visibility and
          reach.
        </p>
      </div>

      {/* SEO Preview */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Search Preview
        </h3>
        <div className="space-y-1">
          <h4 className="text-blue-600 text-lg hover:underline cursor-pointer">
            {metaTitle || "Page Title - Your Site Name"}
          </h4>
          <p className="text-green-700 text-sm">
            yoursite.com › content › slug
          </p>
          <p className="text-gray-600 text-sm">
            {metaDescription ||
              "Page description will appear here. Write a compelling description to improve click-through rates."}
          </p>
        </div>
      </div>

      {/* Meta Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Title
        </label>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) =>
            onChange({
              metaTitle: e.target.value,
              metaDescription,
              metaKeywords,
            })
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="Enter meta title..."
        />
        <div className="mt-1 flex items-center justify-between">
          <span
            className={`text-xs ${
              titleStatus === "good"
                ? "text-green-600"
                : titleStatus === "short"
                  ? "text-yellow-600"
                  : titleStatus === "long"
                    ? "text-red-600"
                    : "text-gray-500"
            }`}
          >
            {titleLength}/60 characters
          </span>
          {titleStatus !== "empty" && titleStatus !== "good" && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {titleStatus === "short"
                ? "Consider making it longer"
                : "Too long, may be truncated"}
            </span>
          )}
        </div>
      </div>

      {/* Meta Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Description
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) =>
            onChange({
              metaTitle,
              metaDescription: e.target.value,
              metaKeywords,
            })
          }
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="Enter meta description..."
        />
        <div className="mt-1 flex items-center justify-between">
          <span
            className={`text-xs ${
              descriptionStatus === "good"
                ? "text-green-600"
                : descriptionStatus === "short"
                  ? "text-yellow-600"
                  : descriptionStatus === "long"
                    ? "text-red-600"
                    : "text-gray-500"
            }`}
          >
            {descriptionLength}/160 characters
          </span>
          {descriptionStatus !== "empty" && descriptionStatus !== "good" && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {descriptionStatus === "short"
                ? "Consider making it longer"
                : "Too long, may be truncated"}
            </span>
          )}
        </div>
      </div>

      {/* Meta Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Keywords
          <span className="text-xs text-gray-500 ml-2">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={metaKeywords}
          onChange={(e) =>
            onChange({
              metaTitle,
              metaDescription,
              metaKeywords: e.target.value,
            })
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="keyword1, keyword2, keyword3..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Focus on 5-10 relevant keywords for better SEO results
        </p>
      </div>

      {/* SEO Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">SEO Tips</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Include your main keyword in the title and description</li>
          <li>• Keep titles under 60 characters to avoid truncation</li>
          <li>
            • Write unique descriptions for each page (120-160 characters)
          </li>
          <li>• Use natural language that encourages clicks</li>
          <li>• Avoid keyword stuffing - focus on readability</li>
        </ul>
      </div>
    </div>
  );
};

export default SEOSettings;

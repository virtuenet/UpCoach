import Grid from "@mui/material/Grid";
import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Image,
  Search,
  FolderOpen,
  List,
  Check,
  File,
  Video,
  Music,
} from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  type: "image" | "video" | "audio" | "document" | "other";
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

interface MediaSelectorProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  allowedTypes?: string[];
  multiple?: boolean;
}

const MediaSelector: React.FC<MediaSelectorProps> = ({
  onSelect,
  onClose,
  allowedTypes = ["image"],
  multiple = false,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMediaItems();
  }, []);

  const loadMediaItems = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data
      setMediaItems([
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
          thumbnailUrl:
            "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300",
          filename: "productivity-workspace.jpg",
          type: "image",
          size: 1024000,
          width: 1920,
          height: 1080,
          createdAt: "2024-01-20T10:00:00Z",
        },
        {
          id: "2",
          url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
          thumbnailUrl:
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300",
          filename: "team-collaboration.jpg",
          type: "image",
          size: 890000,
          width: 1920,
          height: 1280,
          createdAt: "2024-01-19T15:30:00Z",
        },
        {
          id: "3",
          url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe",
          thumbnailUrl:
            "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=300",
          filename: "meditation-peace.jpg",
          type: "image",
          size: 756000,
          width: 1920,
          height: 1080,
          createdAt: "2024-01-18T09:15:00Z",
        },
      ]);
    } catch (error) {
      console.error("Error loading media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // In a real app, this would upload files to the server
      for (const file of Array.from(files)) {
        console.log("Uploading file:", file.name);

        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create a mock media item
        const newItem: MediaItem = {
          id: `new-${Date.now()}`,
          url: URL.createObjectURL(file),
          filename: file.name,
          type: file.type.startsWith("image/") ? "image" : "other",
          size: file.size,
          createdAt: new Date().toISOString(),
        };

        setMediaItems((prev) => [newItem, ...prev]);
      }

      setActiveTab("library");
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
    }
  };

  const toggleSelection = (id: string) => {
    if (multiple) {
      setSelectedItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    } else {
      setSelectedItems([id]);
    }
  };

  const handleConfirm = () => {
    const selected = mediaItems.find((item) => selectedItems.includes(item.id));
    if (selected) {
      onSelect(selected.url);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "audio":
        return <Music className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const filteredItems = mediaItems.filter(
    (item) =>
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (allowedTypes.length === 0 || allowedTypes.includes(item.type)),
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Select Media</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("library")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "library"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "upload"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Upload Files
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "library" ? (
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search media..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Media Grid/List */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleSelection(item.id)}
                        className={`
                          relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                          ${
                            selectedItems.includes(item.id)
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-gray-200 hover:border-gray-300"
                          }
                        `}
                      >
                        {item.type === "image" && item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.filename}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                            {getFileIcon(item.type)}
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-sm font-medium truncate">
                            {item.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(item.size)}
                          </p>
                        </div>
                        {selectedItems.includes(item.id) && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleSelection(item.id)}
                        className={`
                          flex items-center gap-4 p-3 rounded-lg cursor-pointer border
                          ${
                            selectedItems.includes(item.id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }
                        `}
                      >
                        <div className="flex-shrink-0">
                          {item.type === "image" && item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.filename}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                              {getFileIcon(item.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.filename}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(item.size)}
                            {item.width &&
                              item.height &&
                              ` • ${item.width}×${item.height}`}
                          </p>
                        </div>
                        {selectedItems.includes(item.id) && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="max-w-md w-full">
                <label className="block">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    multiple={multiple}
                    accept={allowedTypes.map((type) => `${type}/*`).join(",")}
                    className="sr-only"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported formats: {allowedTypes.join(", ")}
                    </p>
                  </div>
                </label>
                {uploading && (
                  <div className="mt-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedItems.length > 0 && (
              <span>
                {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
                selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaSelector;

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Upload, Search, Grid, List, FolderPlus, Move, Trash2, Edit3, X, } from 'lucide-react';
import { mediaApi } from '../api/media';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
export default function MediaLibraryPage() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    // State
    const [view, setView] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [folderFilter, setFolderFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItems, setSelectedItems] = useState([]);
    const [_showUpload, setShowUpload] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    // Fetch media
    const { data: mediaData, isPending: isLoading, error, } = useQuery({
        queryKey: ['media', searchTerm, typeFilter, folderFilter, currentPage],
        queryFn: () => mediaApi.getMedia({
            search: searchTerm || undefined,
            type: typeFilter === 'all' ? undefined : typeFilter,
            folder: folderFilter === 'all' ? undefined : folderFilter === 'none' ? undefined : folderFilter,
            page: currentPage,
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
        }),
        placeholderData: keepPreviousData,
    });
    // Fetch folders
    const { data: folders = [] } = useQuery({
        queryKey: ['media-folders'],
        queryFn: mediaApi.getFolders,
    });
    // Fetch storage stats
    const { data: storageStats } = useQuery({
        queryKey: ['storage-stats'],
        queryFn: mediaApi.getStorageStats,
    });
    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: ({ files, options }) => mediaApi.uploadFiles(files, options),
        onSuccess: () => {
            toast('Files uploaded successfully!');
            queryClient.invalidateQueries({ queryKey: ['media'] });
            queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
            setShowUpload(false);
        },
        onError: (error) => {
            toast(error instanceof Error ? error.message : 'Failed to upload files');
        },
    });
    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: mediaApi.deleteMedia,
        onSuccess: () => {
            toast('Media deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['media'] });
            queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
            setSelectedItems([]);
        },
        onError: (error) => {
            toast(error instanceof Error ? error.message : 'Failed to delete media');
        },
    });
    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => mediaApi.updateMedia(id, data),
        onSuccess: () => {
            toast('Media updated successfully');
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setEditingItem(null);
        },
        onError: (error) => {
            toast(error instanceof Error ? error.message : 'Failed to update media');
        },
    });
    // Create folder mutation
    const createFolderMutation = useMutation({
        mutationFn: mediaApi.createFolder,
        onSuccess: () => {
            toast('Folder created successfully');
            queryClient.invalidateQueries({ queryKey: ['media-folders'] });
            setShowCreateFolder(false);
            setNewFolderName('');
        },
        onError: (error) => {
            toast(error instanceof Error ? error.message : 'Failed to create folder');
        },
    });
    // Move to folder mutation
    const moveMutation = useMutation({
        mutationFn: ({ mediaIds, folder }) => mediaApi.moveToFolder(mediaIds, folder),
        onSuccess: () => {
            toast('Media moved successfully');
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setShowMoveModal(false);
            setSelectedItems([]);
        },
        onError: (error) => {
            toast(error instanceof Error ? error.message : 'Failed to move media');
        },
    });
    // Dropzone for drag & drop uploads
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length === 0)
            return;
        // Validate files
        const validFiles = [];
        const errors = [];
        acceptedFiles.forEach(file => {
            const validation = mediaApi.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            }
            else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });
        if (errors.length > 0) {
            toast(`Some files were rejected:\n${errors.join('\n')}`);
        }
        if (validFiles.length > 0) {
            uploadMutation.mutate({
                files: validFiles,
                options: {
                    folder: folderFilter === 'all' || folderFilter === 'none' ? undefined : folderFilter,
                },
            });
        }
    }, [uploadMutation, folderFilter]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        multiple: true,
    });
    // Event handlers
    const handleFileSelect = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            onDrop(Array.from(files));
        }
    };
    const handleSelectItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };
    const handleSelectAll = () => {
        if (selectedItems.length === mediaData?.data.length) {
            setSelectedItems([]);
        }
        else {
            setSelectedItems(mediaData?.data.map(item => item.id) || []);
        }
    };
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this media item?')) {
            deleteMutation.mutate(id);
        }
    };
    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedItems.length} media items?`)) {
            selectedItems.forEach(id => deleteMutation.mutate(id));
        }
    };
    const handleUpdateMedia = (data) => {
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data });
        }
    };
    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            createFolderMutation.mutate(newFolderName.trim());
        }
    };
    const handleMoveToFolder = (folder) => {
        if (selectedItems.length > 0) {
            moveMutation.mutate({ mediaIds: selectedItems, folder });
        }
    };
    // const getFileIcon = (mimeType: string) => {
    //   if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
    //   if (mimeType.startsWith('video/')) return <Video className="h-5 w-5" />
    //   if (mimeType.startsWith('audio/')) return <Music className="h-5 w-5" />
    //   if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-5 w-5" />
    //   return <File className="h-5 w-5" />
    // }
    if (error) {
        return (_jsx("div", { className: "max-w-7xl mx-auto py-6", children: _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: [_jsx("h3", { className: "text-lg font-medium text-red-800", children: "Error loading media library" }), _jsx("p", { className: "text-red-700 mt-2", children: error instanceof Error ? error.message : 'Failed to load media library' })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6", ...getRootProps(), children: [_jsx("input", { ...getInputProps() }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Media Library" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Manage your files and media assets" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: () => setShowCreateFolder(true), className: "flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50", children: [_jsx(FolderPlus, { className: "h-4 w-4" }), "New Folder"] }), _jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700", children: [_jsx(Upload, { className: "h-4 w-4" }), "Upload Files"] }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, onChange: handleFileSelect, className: "hidden", accept: "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" })] })] }), storageStats && (_jsx("div", { className: "bg-white p-4 rounded-lg shadow", children: _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900", children: storageStats.totalFiles }), _jsx("div", { className: "text-sm text-gray-500", children: "Total Files" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900", children: mediaApi.formatFileSize(storageStats.totalSize) }), _jsx("div", { className: "text-sm text-gray-500", children: "Total Size" })] }), Object.entries(storageStats.byType).map(([type, stats]) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900", children: stats.count }), _jsxs("div", { className: "text-sm text-gray-500 capitalize", children: [type, " Files"] })] }, type)))] }) })), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow", children: [_jsxs("div", { className: "flex flex-col lg:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search media...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), className: "pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500" })] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { value: typeFilter, onChange: e => setTypeFilter(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "image", children: "Images" }), _jsx("option", { value: "video", children: "Videos" }), _jsx("option", { value: "audio", children: "Audio" }), _jsx("option", { value: "document", children: "Documents" })] }), _jsxs("select", { value: folderFilter, onChange: e => setFolderFilter(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "all", children: "All Folders" }), _jsx("option", { value: "none", children: "No Folder" }), folders.map(folder => (_jsx("option", { value: folder, children: folder }, folder)))] }), _jsxs("div", { className: "flex border border-gray-300 rounded-lg", children: [_jsx("button", { onClick: () => setView('grid'), className: `p-2 ${view === 'grid' ? 'bg-gray-100' : ''}`, children: _jsx(Grid, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => setView('list'), className: `p-2 ${view === 'list' ? 'bg-gray-100' : ''}`, children: _jsx(List, { className: "h-4 w-4" }) })] })] })] }), selectedItems.length > 0 && (_jsxs("div", { className: "mt-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg", children: [_jsxs("span", { className: "text-sm text-blue-700", children: [selectedItems.length, " item(s) selected"] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => setShowMoveModal(true), className: "flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700", children: [_jsx(Move, { className: "h-4 w-4" }), "Move"] }), _jsxs("button", { onClick: handleBulkDelete, className: "flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700", children: [_jsx(Trash2, { className: "h-4 w-4" }), "Delete"] }), _jsxs("button", { onClick: () => setSelectedItems([]), className: "flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50", children: [_jsx(X, { className: "h-4 w-4" }), "Clear"] })] })] }))] }), isDragActive && (_jsx("div", { className: "fixed inset-0 bg-blue-600 bg-opacity-75 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white p-8 rounded-lg text-center", children: [_jsx(Upload, { className: "h-12 w-12 mx-auto text-blue-600 mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Drop files to upload" }), _jsx("p", { className: "text-gray-500", children: "Release to start uploading" })] }) })), _jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [isLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) })) : !mediaData?.data?.length ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Upload, { className: "h-12 w-12 mx-auto text-gray-400 mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No media found" }), _jsx("p", { className: "text-gray-500 mb-4", children: searchTerm || typeFilter !== 'all' || folderFilter !== 'all'
                                    ? 'Try adjusting your search or filters.'
                                    : 'Upload your first file to get started.' }), _jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "inline-flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700", children: [_jsx(Upload, { className: "h-4 w-4" }), "Upload Files"] })] })) : view === 'grid' ? (_jsx("div", { className: "p-6", children: _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4", children: mediaData.data.map(item => (_jsx(MediaGridItem, { item: item, isSelected: selectedItems.includes(item.id), onSelect: () => handleSelectItem(item.id), onEdit: () => setEditingItem(item), onDelete: () => handleDelete(item.id) }, item.id))) }) })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left", children: _jsx("input", { type: "checkbox", checked: selectedItems.length === mediaData.data.length, onChange: handleSelectAll, className: "rounded border-gray-300" }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "File" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Size" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Folder" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Uploaded" }), _jsx("th", { className: "relative px-6 py-3", children: _jsx("span", { className: "sr-only", children: "Actions" }) })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: mediaData.data.map(item => (_jsx(MediaListItem, { item: item, isSelected: selectedItems.includes(item.id), onSelect: () => handleSelectItem(item.id), onEdit: () => setEditingItem(item), onDelete: () => handleDelete(item.id) }, item.id))) })] }) })), mediaData?.pagination && mediaData.pagination.totalPages > 1 && (_jsxs("div", { className: "bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6", children: [_jsxs("div", { className: "flex-1 flex justify-between sm:hidden", children: [_jsx("button", { onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, className: "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50", children: "Previous" }), _jsx("button", { onClick: () => setCurrentPage(Math.min(mediaData.pagination.totalPages, currentPage + 1)), disabled: currentPage === mediaData.pagination.totalPages, className: "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50", children: "Next" })] }), _jsxs("div", { className: "hidden sm:flex-1 sm:flex sm:items-center sm:justify-between", children: [_jsx("div", { children: _jsxs("p", { className: "text-sm text-gray-700", children: ["Showing", ' ', _jsx("span", { className: "font-medium", children: (currentPage - 1) * mediaData.pagination.itemsPerPage + 1 }), ' ', "to", ' ', _jsx("span", { className: "font-medium", children: Math.min(currentPage * mediaData.pagination.itemsPerPage, mediaData.pagination.totalItems) }), ' ', "of ", _jsx("span", { className: "font-medium", children: mediaData.pagination.totalItems }), " results"] }) }), _jsx("div", { children: _jsxs("nav", { className: "relative z-0 inline-flex rounded-md shadow-sm -space-x-px", children: [_jsx("button", { onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, className: "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50", children: "Previous" }), Array.from({ length: Math.min(5, mediaData.pagination.totalPages) }, (_, i) => {
                                                    const page = i + 1;
                                                    return (_jsx("button", { onClick: () => setCurrentPage(page), className: `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                                                            ? 'z-10 bg-secondary-50 border-secondary-500 text-secondary-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`, children: page }, page));
                                                }), _jsx("button", { onClick: () => setCurrentPage(Math.min(mediaData.pagination.totalPages, currentPage + 1)), disabled: currentPage === mediaData.pagination.totalPages, className: "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50", children: "Next" })] }) })] })] }))] }), showCreateFolder && (_jsx(CreateFolderModal, { value: newFolderName, onChange: setNewFolderName, onSave: handleCreateFolder, onClose: () => setShowCreateFolder(false), isPending: createFolderMutation.isPending })), showMoveModal && (_jsx(MoveToFolderModal, { folders: folders, onMove: handleMoveToFolder, onClose: () => setShowMoveModal(false), isPending: moveMutation.isPending })), editingItem && (_jsx(EditMediaModal, { item: editingItem, onSave: handleUpdateMedia, onClose: () => setEditingItem(null), isPending: updateMutation.isPending }))] }));
}
// Grid item component
const MediaGridItem = ({ item, isSelected, onSelect, onEdit, onDelete, }) => {
    const fileIcon = mediaApi.getFileIcon(item.mimeType);
    return (_jsxs("div", { className: "relative group bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors", children: [_jsx("div", { className: "aspect-square p-4 flex items-center justify-center", children: item.mimeType.startsWith('image/') && item.thumbnailUrl ? (_jsx("img", { src: item.thumbnailUrl, alt: item.alt || item.originalName, className: "max-w-full max-h-full object-contain" })) : (_jsx("div", { className: "text-4xl", children: fileIcon })) }), _jsxs("div", { className: "p-3", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900 truncate", title: item.originalName, children: item.originalName }), _jsx("p", { className: "text-xs text-gray-500", children: mediaApi.formatFileSize(item.fileSize) }), item.folder && _jsxs("p", { className: "text-xs text-blue-600", children: ["\uD83D\uDCC1 ", item.folder] })] }), _jsx("div", { className: "absolute top-2 left-2", children: _jsx("input", { type: "checkbox", checked: isSelected, onChange: onSelect, className: "rounded border-gray-300 bg-white shadow" }) }), _jsx("div", { className: "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: onEdit, className: "p-1 bg-white rounded shadow hover:bg-gray-50", children: _jsx(Edit3, { className: "h-3 w-3" }) }), _jsx("button", { onClick: onDelete, className: "p-1 bg-white rounded shadow hover:bg-gray-50 text-red-600", children: _jsx(Trash2, { className: "h-3 w-3" }) })] }) })] }));
};
// List item component
const MediaListItem = ({ item, isSelected, onSelect, onEdit, onDelete, }) => {
    const fileIcon = mediaApi.getFileIcon(item.mimeType);
    return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("input", { type: "checkbox", checked: isSelected, onChange: onSelect, className: "rounded border-gray-300" }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0 h-10 w-10 flex items-center justify-center", children: item.mimeType.startsWith('image/') && item.thumbnailUrl ? (_jsx("img", { src: item.thumbnailUrl, alt: item.alt || item.originalName, className: "h-8 w-8 object-cover rounded" })) : (_jsx("div", { className: "text-lg", children: fileIcon })) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: item.originalName }), item.alt && _jsx("div", { className: "text-sm text-gray-500", children: item.alt })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "text-sm text-gray-900 capitalize", children: mediaApi.getFileType(item.mimeType) }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: mediaApi.formatFileSize(item.fileSize) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: item.folder || '—' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: format(new Date(item.createdAt), 'MMM d, yyyy') }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs("div", { className: "flex items-center justify-end space-x-2", children: [_jsx("button", { onClick: onEdit, className: "text-indigo-600 hover:text-indigo-900", children: _jsx(Edit3, { className: "h-4 w-4" }) }), _jsx("button", { onClick: onDelete, className: "text-red-600 hover:text-red-900", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }));
};
// Create folder modal
const CreateFolderModal = ({ value, onChange, onSave, onClose, isPending, }) => {
    return (_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-md", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Create New Folder" }), _jsx("input", { type: "text", value: value, onChange: e => onChange(e.target.value), placeholder: "Folder name", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", onKeyPress: e => e.key === 'Enter' && onSave(), autoFocus: true }), _jsxs("div", { className: "flex justify-end space-x-3 mt-6", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50", children: "Cancel" }), _jsx("button", { onClick: onSave, disabled: !value.trim() || isPending, className: "px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-md hover:bg-secondary-700 disabled:opacity-50", children: isPending ? 'Creating...' : 'Create' })] })] }) }));
};
// Move to folder modal
const MoveToFolderModal = ({ folders, onMove, onClose, isPending, }) => {
    const [selectedFolder, setSelectedFolder] = useState('');
    return (_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-md", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Move to Folder" }), _jsxs("select", { value: selectedFolder, onChange: e => setSelectedFolder(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "", children: "No Folder" }), folders.map(folder => (_jsx("option", { value: folder, children: folder }, folder)))] }), _jsxs("div", { className: "flex justify-end space-x-3 mt-6", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50", children: "Cancel" }), _jsx("button", { onClick: () => onMove(selectedFolder || null), disabled: isPending, className: "px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-md hover:bg-secondary-700 disabled:opacity-50", children: isPending ? 'Moving...' : 'Move' })] })] }) }));
};
// Edit media modal
const EditMediaModal = ({ item, onSave, onClose, isPending, }) => {
    const [formData, setFormData] = useState({
        alt: item.alt || '',
        caption: item.caption || '',
        tags: item.tags.join(', '),
        isPublic: item.isPublic,
    });
    const handleSave = () => {
        onSave({
            ...formData,
            tags: formData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean)
                .join(', '),
        });
    };
    return (_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-lg", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Edit Media" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Alt Text" }), _jsx("input", { type: "text", value: formData.alt, onChange: e => setFormData({ ...formData, alt: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "Describe this image" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Caption" }), _jsx("textarea", { value: formData.caption, onChange: e => setFormData({ ...formData, caption: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "Add a caption" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Tags" }), _jsx("input", { type: "text", value: formData.tags, onChange: e => setFormData({ ...formData, tags: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "tag1, tag2, tag3" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "isPublic", checked: formData.isPublic, onChange: e => setFormData({ ...formData, isPublic: e.target.checked }), className: "rounded border-gray-300 text-secondary-600 focus:ring-secondary-500" }), _jsx("label", { htmlFor: "isPublic", className: "ml-2 text-sm text-gray-700", children: "Make publicly accessible" })] })] }), _jsxs("div", { className: "flex justify-end space-x-3 mt-6", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: isPending, className: "px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-md hover:bg-secondary-700 disabled:opacity-50", children: isPending ? 'Saving...' : 'Save Changes' })] })] }) }));
};
//# sourceMappingURL=MediaLibraryPage.js.map
import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  FolderPlus, 
  Move, 
  Trash2, 
  Edit3, 
  Download,
  Eye,
  MoreVertical,
  X,
  Check,
  Image as ImageIcon,
  File,
  Video,
  Music,
  FileText
} from 'lucide-react'
import { mediaApi, MediaItem } from '../api/media'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function MediaLibraryPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [folderFilter, setFolderFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [newFolderName, setNewFolderName] = useState('')

  // Fetch media
  const { data: mediaData, isLoading, error } = useQuery({
    queryKey: ['media', searchTerm, typeFilter, folderFilter, currentPage],
    queryFn: () => mediaApi.getMedia({
      search: searchTerm || undefined,
      type: typeFilter === 'all' ? undefined : typeFilter,
      folder: folderFilter === 'all' ? undefined : (folderFilter === 'none' ? null : folderFilter),
      page: currentPage,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    }),
    keepPreviousData: true,
  })

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ['media-folders'],
    queryFn: mediaApi.getFolders,
  })

  // Fetch storage stats
  const { data: storageStats } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: mediaApi.getStorageStats,
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ files, options }: { files: FileList | File[], options: any }) => 
      mediaApi.uploadFiles(files, options),
    onSuccess: () => {
      toast.success('Files uploaded successfully!')
      queryClient.invalidateQueries(['media'])
      queryClient.invalidateQueries(['storage-stats'])
      setShowUpload(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload files')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: mediaApi.deleteMedia,
    onSuccess: () => {
      toast.success('Media deleted successfully')
      queryClient.invalidateQueries(['media'])
      queryClient.invalidateQueries(['storage-stats'])
      setSelectedItems([])
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete media')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => mediaApi.updateMedia(id, data),
    onSuccess: () => {
      toast.success('Media updated successfully')
      queryClient.invalidateQueries(['media'])
      setEditingItem(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update media')
    },
  })

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: mediaApi.createFolder,
    onSuccess: () => {
      toast.success('Folder created successfully')
      queryClient.invalidateQueries(['media-folders'])
      setShowCreateFolder(false)
      setNewFolderName('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create folder')
    },
  })

  // Move to folder mutation
  const moveMutation = useMutation({
    mutationFn: ({ mediaIds, folder }: { mediaIds: string[], folder: string | null }) => 
      mediaApi.moveToFolder(mediaIds, folder),
    onSuccess: () => {
      toast.success('Media moved successfully')
      queryClient.invalidateQueries(['media'])
      setShowMoveModal(false)
      setSelectedItems([])
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to move media')
    },
  })

  // Dropzone for drag & drop uploads
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Validate files
    const validFiles: File[] = []
    const errors: string[] = []

    acceptedFiles.forEach(file => {
      const validation = mediaApi.validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) {
      toast.error(`Some files were rejected:\n${errors.join('\n')}`)
    }

    if (validFiles.length > 0) {
      uploadMutation.mutate({ 
        files: validFiles, 
        options: { folder: folderFilter === 'all' || folderFilter === 'none' ? undefined : folderFilter }
      })
    }
  }, [uploadMutation, folderFilter])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    multiple: true,
  })

  // Event handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onDrop(Array.from(files))
    }
  }

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === mediaData?.data.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(mediaData?.data.map(item => item.id) || [])
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this media item?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} media items?`)) {
      selectedItems.forEach(id => deleteMutation.mutate(id))
    }
  }

  const handleUpdateMedia = (data: any) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data })
    }
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim())
    }
  }

  const handleMoveToFolder = (folder: string | null) => {
    if (selectedItems.length > 0) {
      moveMutation.mutate({ mediaIds: selectedItems, folder })
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5" />
    if (mimeType.startsWith('audio/')) return <Music className="h-5 w-5" />
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800">Error loading media library</h3>
          <p className="text-red-700 mt-2">{error.message || 'Failed to load media library'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Media Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your files and media assets
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700"
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          />
        </div>
      </div>

      {/* Storage Stats */}
      {storageStats && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{storageStats.totalFiles}</div>
              <div className="text-sm text-gray-500">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {mediaApi.formatFileSize(storageStats.totalSize)}
              </div>
              <div className="text-sm text-gray-500">Total Size</div>
            </div>
            {Object.entries(storageStats.byType).map(([type, stats]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.count}</div>
                <div className="text-sm text-gray-500 capitalize">{type} Files</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>

            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
            >
              <option value="all">All Folders</option>
              <option value="none">No Folder</option>
              {folders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>

            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setView('grid')}
                className={`p-2 ${view === 'grid' ? 'bg-gray-100' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 ${view === 'list' ? 'bg-gray-100' : ''}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <span className="text-sm text-blue-700">
              {selectedItems.length} item(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMoveModal(true)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Move className="h-4 w-4" />
                Move
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Overlay */}
      {isDragActive && (
        <div className="fixed inset-0 bg-blue-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <Upload className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Drop files to upload</h3>
            <p className="text-gray-500">Release to start uploading</p>
          </div>
        </div>
      )}

      {/* Media Grid/List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : !mediaData?.data?.length ? (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || typeFilter !== 'all' || folderFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Upload your first file to get started.'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700"
            >
              <Upload className="h-4 w-4" />
              Upload Files
            </button>
          </div>
        ) : view === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {mediaData.data.map((item) => (
                <MediaGridItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={() => handleSelectItem(item.id)}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === mediaData.data.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mediaData.data.map((item) => (
                  <MediaListItem
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.includes(item.id)}
                    onSelect={() => handleSelectItem(item.id)}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {mediaData?.pagination && mediaData.pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(mediaData.pagination.totalPages, currentPage + 1))}
                disabled={currentPage === mediaData.pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * mediaData.pagination.itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * mediaData.pagination.itemsPerPage, mediaData.pagination.totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{mediaData.pagination.totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, mediaData.pagination.totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-secondary-50 border-secondary-500 text-secondary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(mediaData.pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === mediaData.pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateFolder && (
        <CreateFolderModal
          value={newFolderName}
          onChange={setNewFolderName}
          onSave={handleCreateFolder}
          onClose={() => setShowCreateFolder(false)}
          isLoading={createFolderMutation.isLoading}
        />
      )}

      {showMoveModal && (
        <MoveToFolderModal
          folders={folders}
          onMove={handleMoveToFolder}
          onClose={() => setShowMoveModal(false)}
          isLoading={moveMutation.isLoading}
        />
      )}

      {editingItem && (
        <EditMediaModal
          item={editingItem}
          onSave={handleUpdateMedia}
          onClose={() => setEditingItem(null)}
          isLoading={updateMutation.isLoading}
        />
      )}
    </div>
  )
}

// Grid item component
const MediaGridItem = ({ item, isSelected, onSelect, onEdit, onDelete }: {
  item: MediaItem
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) => {
  const fileIcon = mediaApi.getFileIcon(item.mimeType)

  return (
    <div className="relative group bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors">
      <div className="aspect-square p-4 flex items-center justify-center">
        {item.mimeType.startsWith('image/') && item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.alt || item.originalName}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-4xl">{fileIcon}</div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 truncate" title={item.originalName}>
          {item.originalName}
        </h3>
        <p className="text-xs text-gray-500">
          {mediaApi.formatFileSize(item.fileSize)}
        </p>
        {item.folder && (
          <p className="text-xs text-blue-600">📁 {item.folder}</p>
        )}
      </div>

      {/* Selection checkbox */}
      <div className="absolute top-2 left-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300 bg-white shadow"
        />
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1 bg-white rounded shadow hover:bg-gray-50"
          >
            <Edit3 className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 bg-white rounded shadow hover:bg-gray-50 text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// List item component
const MediaListItem = ({ item, isSelected, onSelect, onEdit, onDelete }: {
  item: MediaItem
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) => {
  const fileIcon = mediaApi.getFileIcon(item.mimeType)

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
            {item.mimeType.startsWith('image/') && item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.alt || item.originalName}
                className="h-8 w-8 object-cover rounded"
              />
            ) : (
              <div className="text-lg">{fileIcon}</div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{item.originalName}</div>
            {item.alt && (
              <div className="text-sm text-gray-500">{item.alt}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 capitalize">
          {mediaApi.getFileType(item.mimeType)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {mediaApi.formatFileSize(item.fileSize)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {item.folder || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {format(new Date(item.createdAt), 'MMM d, yyyy')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={onEdit}
            className="text-indigo-600 hover:text-indigo-900"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// Create folder modal
const CreateFolderModal = ({ value, onChange, onSave, onClose, isLoading }: {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onClose: () => void
  isLoading: boolean
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Folder</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Folder name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
          onKeyPress={(e) => e.key === 'Enter' && onSave()}
          autoFocus
        />
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!value.trim() || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-md hover:bg-secondary-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Move to folder modal
const MoveToFolderModal = ({ folders, onMove, onClose, isLoading }: {
  folders: string[]
  onMove: (folder: string | null) => void
  onClose: () => void
  isLoading: boolean
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('')

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Move to Folder</h3>
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
        >
          <option value="">No Folder</option>
          {folders.map(folder => (
            <option key={folder} value={folder}>{folder}</option>
          ))}
        </select>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onMove(selectedFolder || null)}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-md hover:bg-secondary-700 disabled:opacity-50"
          >
            {isLoading ? 'Moving...' : 'Move'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Edit media modal
const EditMediaModal = ({ item, onSave, onClose, isLoading }: {
  item: MediaItem
  onSave: (data: any) => void
  onClose: () => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState({
    alt: item.alt || '',
    caption: item.caption || '',
    tags: item.tags.join(', '),
    isPublic: item.isPublic,
  })

  const handleSave = () => {
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean).join(', '),
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Media</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text
            </label>
            <input
              type="text"
              value={formData.alt}
              onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
              placeholder="Describe this image"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
              placeholder="Add a caption"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              Make publicly accessible
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-md hover:bg-secondary-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
} 
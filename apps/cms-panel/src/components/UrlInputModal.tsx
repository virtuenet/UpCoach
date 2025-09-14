import { useState, useEffect } from 'react';
import { X, Link, AlertCircle } from 'lucide-react';
import { validateUserUrl } from '../utils/urlValidator';

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  title: string;
  placeholder?: string;
  validateImage?: boolean;
}

export default function UrlInputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder = 'https://example.com',
  validateImage = false,
}: UrlInputModalProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      const validation = validateUserUrl(url);

      if (!validation.valid) {
        setError(validation.error || 'Invalid URL');
        setIsValidating(false);
        return;
      }

      const safeUrl = validation.sanitized || url;

      // Additional validation for images
      if (validateImage) {
        // Check if it looks like an image URL
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
        if (
          !imageExtensions.test(safeUrl) &&
          !safeUrl.includes('unsplash') &&
          !safeUrl.includes('pexels')
        ) {
          setError('Please provide a direct link to an image file');
          setIsValidating(false);
          return;
        }
      }

      onSubmit(safeUrl);
      onClose();
    } catch (err) {
      setError('An error occurred while validating the URL');
    } finally {
      setIsValidating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="url-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 id="url-modal-title" className="text-lg font-semibold flex items-center">
            <Link className="h-5 w-5 mr-2" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                setError(''); // Clear error on change
              }}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              autoFocus
              required
            />
            {error && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              {validateImage
                ? 'Enter a direct link to an image (JPG, PNG, GIF, WebP, or SVG)'
                : 'Enter a valid URL starting with http:// or https://'}
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isValidating || !url.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? 'Validating...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

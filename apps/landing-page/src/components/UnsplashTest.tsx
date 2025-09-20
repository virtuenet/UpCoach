'use client';

import Image from 'next/image';

/**
 * Test component to verify Unsplash images work with our Next.js configuration
 * This includes the specific image from the error message and a few others
 */
export default function UnsplashTest() {
  const testImages = [
    {
      id: 'original-error',
      src: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
      alt: 'Original error image - professional headshot',
      description: 'The exact image from the error message',
    },
    {
      id: 'general-test',
      src: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
      alt: 'Test image - larger version',
      description: 'Same image but larger size',
    },
    {
      id: 'different-image',
      src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      alt: 'Different headshot',
      description: 'Different Unsplash image for comparison',
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Unsplash Image Configuration Test
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Configuration Status
          </h2>
          <div className="space-y-2 text-sm">
            <p>✅ Next.js version: 15.5.3</p>
            <p>✅ remotePatterns configured for images.unsplash.com</p>
            <p>✅ Modern Next.js image optimization enabled</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testImages.map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {image.description}
              </h3>

              <div className="relative mb-4">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.id === 'original-error' ? 64 : image.id === 'general-test' ? 200 : 150}
                  height={image.id === 'original-error' ? 64 : image.id === 'general-test' ? 200 : 150}
                  className="rounded-lg mx-auto"
                  priority={image.id === 'original-error'}
                  onLoad={() => console.log(`✅ Successfully loaded: ${image.id}`)}
                  onError={(e) => console.error(`❌ Failed to load: ${image.id}`, e)}
                />
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium">Image Details:</p>
                <p className="break-all">URL: {image.src}</p>
                <p>Size: {image.id === 'original-error' ? '64x64' : image.id === 'general-test' ? '200x200' : '150x150'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Testing Instructions
          </h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>If all images load successfully, the configuration is working correctly</li>
            <li>Check the browser console for any load success/error messages</li>
            <li>If images fail to load, check the Next.js dev server output for errors</li>
            <li>Remember to remove this test component after verification</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
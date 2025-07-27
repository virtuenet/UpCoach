export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero skeleton */}
      <div className="h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 animate-pulse">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="h-12 w-64 bg-gray-200 rounded-full"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-20 bg-gray-200 rounded-lg"></div>
                <div className="flex gap-4">
                  <div className="h-14 w-48 bg-gray-900 rounded-xl"></div>
                  <div className="h-14 w-48 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
              <div className="h-96 bg-gray-200 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features skeleton */}
      <div className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="h-8 w-32 bg-gray-200 rounded mx-auto mb-4"></div>
            <div className="h-12 w-96 bg-gray-200 rounded mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-white rounded-2xl animate-pulse shadow-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
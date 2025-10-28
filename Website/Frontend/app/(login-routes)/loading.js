export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-5">
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-10 w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10">
        <div className="py-6">
          <div className="w-32 h-16 mx-auto mb-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="h-12 bg-red-200 dark:bg-red-900 rounded-3xl animate-pulse mt-4"></div>
        </div>
      </div>
    </div>
  );
}

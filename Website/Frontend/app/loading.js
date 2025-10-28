export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}

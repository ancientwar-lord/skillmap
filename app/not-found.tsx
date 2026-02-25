import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 text-center">
      <h1 className="text-7xl font-extrabold text-purple-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-800 mb-2">
        Page Not Found
      </h2>
      <p className="text-slate-500 mb-8 max-w-md">
        The page you are looking for doesn&apos;t exist or you don&apos;t have
        permission to access it.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        Go back home
      </Link>
    </div>
  );
}

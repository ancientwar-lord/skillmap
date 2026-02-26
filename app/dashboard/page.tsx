import { verifySession } from '@/lib/dal';

export default async function DashboardPage() {
  const session = await verifySession();

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Dashboard</h1>
      <p className="text-lg text-slate-600 mb-8">
        Welcome{session.user.name ? `, ${session.user.name}` : ''}! Here you can
        manage your profile, view your activity, and access all the features
        skillmap has to offer.
      </p>
    </div>
  );
}

import { verifySession } from '@/lib/dal';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const session = await verifySession();

  return <DashboardContent userName={session.user.name} />;
}

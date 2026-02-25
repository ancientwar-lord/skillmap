import { verifySession } from '@/lib/dal';

const SettingsPage = async () => {
  await verifySession();

  return (
      <div className="p-6 ">Settings Page</div>
  );
};

export default SettingsPage;
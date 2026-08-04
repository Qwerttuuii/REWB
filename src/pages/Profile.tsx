import { User, Activity, FileText, PackageCheck, AlertTriangle, Clock,  CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export default function Profile() {
 

const [userProfile, setUserProfile] = useState<any>(null);
const [lastLogin, setLastLogin] = useState<string>('—');
const [loading, setLoading] = useState(true);

  const activity = {
    transactionsRecorded: 0,
    itemsAdded: 6,
    alertsFlagged: 3,
  };
  useEffect(() => {
  fetchProfile();
}, []);

const fetchProfile = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    setUserProfile(data);

    // Format the real last sign-in time from Supabase Auth
    if (user.last_sign_in_at) {
      const formatted = new Date(user.last_sign_in_at).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastLogin(formatted);
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
  } finally {
    setLoading(false);
  }
};
if (loading) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <p>Loading profile...</p>
    </div>
  );
}

  return (
    
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Account information and preferences</p>
        </div>

        {/* User Profile + Account Activity */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">

        {/* User Profile Card */}
<div className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-100">
  <div className="flex items-center gap-2 mb-6">
    <User className="w-5 h-5 text-emerald-600" />
    <h3 className="text-xl font-semibold text-gray-900">User Profile</h3>
  </div>

  <div className="space-y-5">
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">
        Full Name
      </p>
      <p className="font-medium text-gray-900 mt-1">
        {userProfile?.full_name || 'Not Set'}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">
        Username
      </p>
      <p className="font-medium text-gray-900 mt-1">
        {userProfile?.username || 'Not Set'}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">
        Email
      </p>
      <p className="font-medium text-gray-900 mt-1">
        {userProfile?.email || 'Not Set'}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">
        Role
      </p>
      <p className="font-medium text-gray-900 mt-1">
        {userProfile?.role || 'Stores Manager'}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">
        Assigned Warehouse
      </p>
      <p className="font-medium text-gray-900 mt-1">
        {userProfile?.warehouse || 'Not Assigned'}
      </p>
    </div>

    <div className="flex items-center gap-2 pt-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      <span className="text-emerald-600 font-medium text-sm">
        {userProfile?.status || 'Active'}
      </span>
    </div>
  </div>
</div>

          {/* Account Activity Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xl font-semibold text-gray-900">Account Activity</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs uppercase tracking-wide text-gray-500 leading-tight">
                    Transactions<br />Recorded
                  </p>
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-3">{activity.transactionsRecorded}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs uppercase tracking-wide text-gray-500 leading-tight">Items Added</p>
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-3">{activity.itemsAdded}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs uppercase tracking-wide text-gray-500 leading-tight">
                    Alerts<br />Flagged
                  </p>
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-3">{activity.alertsFlagged}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs uppercase tracking-wide text-gray-500 leading-tight">Last Login</p>
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 mt-3 leading-tight">{lastLogin}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          REWB CORE 
        </div>

      </div>
    </div>
  );
}
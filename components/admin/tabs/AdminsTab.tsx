import React from 'react';
import { User, UserPermissions } from '../../../types';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';

interface Props {
  users: User[];
  isSuperAdmin: boolean;
  currentUserId?: string;
  newAdminName: string;
  setNewAdminName: (value: string) => void;
  newAdminEmail: string;
  setNewAdminEmail: (value: string) => void;
  newAdminPassword: string;
  setNewAdminPassword: (value: string) => void;
  newAdminPermissions: UserPermissions;
  setNewAdminPermissions: React.Dispatch<React.SetStateAction<UserPermissions>>;
  onAddAdmin: (e: React.FormEvent) => Promise<void> | void;
  onDeleteAdmin: (adminId: string) => void;
}

export const AdminsTab: React.FC<Props> = ({
  users,
  isSuperAdmin,
  currentUserId,
  newAdminName,
  setNewAdminName,
  newAdminEmail,
  setNewAdminEmail,
  newAdminPassword,
  setNewAdminPassword,
  newAdminPermissions,
  setNewAdminPermissions,
  onAddAdmin,
  onDeleteAdmin,
}) => {
  const admins = users.filter((u) => u.role === 'admin' || u.role === 'superadmin');

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader title="Admin Access" subtitle="Role-based admin management" />

      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Admin</h3>
        <form onSubmit={onAddAdmin} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required placeholder="e.g. Priya Sharma" className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600" />
            <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required placeholder="e.g. admin@futurex.com" className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600" />
            <input type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required minLength={6} placeholder="e.g. admin123" className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(Object.keys(newAdminPermissions) as Array<keyof UserPermissions>).map((perm) => (
              <label key={perm} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 p-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean(newAdminPermissions[perm])}
                  onChange={(e) => setNewAdminPermissions((prev) => ({ ...prev, [perm]: e.target.checked }))}
                />
                {perm}
              </label>
            ))}
          </div>
          <Button type="submit" disabled={!isSuperAdmin}>Create Admin</Button>
        </form>
      </div>

      <div className="space-y-3">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{admin.name}</p>
              <p className="text-sm text-gray-500">{admin.email}</p>
              <span className={`inline-flex mt-2 rounded-full px-2.5 py-1 text-xs font-semibold ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'}`}>
                {admin.role}
              </span>
            </div>
            {admin.role !== 'superadmin' && admin.id !== currentUserId && isSuperAdmin ? (
              <Button size="sm" variant="danger" onClick={() => onDeleteAdmin(admin.id)}>Remove</Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

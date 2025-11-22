import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';

type Coach = {
  id: number;
  displayName: string;
  title?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt?: string;
};

export default function MarketplaceModerationPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoaches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get('/coaches/admin/list');
      const rows: Coach[] = (data?.data || []).map((c: any) => ({
        id: c.id,
        displayName: c.display_name || c.name || `Coach #${c.id}`,
        title: c.title,
        isActive: !!c.isActive,
        isVerified: !!c.isVerified,
        createdAt: c.createdAt || c.created_at,
      }));
      setCoaches(rows);
    } catch (e: any) {
      setError(e?.message || 'Failed to load coaches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  const handleVerify = useCallback(async (id: number, isVerified: boolean) => {
    await apiClient.put(`/coaches/admin/${id}/verify`, { isVerified });
    await fetchCoaches();
  }, [fetchCoaches]);

  const handleActive = useCallback(async (id: number, isActive: boolean) => {
    await apiClient.put(`/coaches/admin/${id}/status`, { isActive });
    await fetchCoaches();
  }, [fetchCoaches]);

  const table = useMemo(() => (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left p-2 border-b">Coach</th>
          <th className="text-left p-2 border-b">Title</th>
          <th className="text-left p-2 border-b">Verified</th>
          <th className="text-left p-2 border-b">Active</th>
          <th className="text-left p-2 border-b">Actions</th>
        </tr>
      </thead>
      <tbody>
        {coaches.map((c) => (
          <tr key={c.id} className="hover:bg-muted/30">
            <td className="p-2 border-b">{c.displayName}</td>
            <td className="p-2 border-b">{c.title || '-'}</td>
            <td className="p-2 border-b">{c.isVerified ? 'Yes' : 'No'}</td>
            <td className="p-2 border-b">{c.isActive ? 'Yes' : 'No'}</td>
            <td className="p-2 border-b">
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify(c.id, true)}
                  className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                  disabled={loading || c.isVerified}
                  aria-label={`Verify coach ${c.displayName}`}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleVerify(c.id, false)}
                  className="px-3 py-1 rounded bg-amber-600 text-white disabled:opacity-50"
                  disabled={loading || !c.isVerified}
                  aria-label={`Unverify coach ${c.displayName}`}
                >
                  Unverify
                </button>
                <button
                  onClick={() => handleActive(c.id, !c.isActive)}
                  className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-50"
                  disabled={loading}
                  aria-label={`${c.isActive ? 'Deactivate' : 'Activate'} coach ${c.displayName}`}
                >
                  {c.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ), [coaches, handleActive, handleVerify, loading]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Marketplace Moderation</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoaches}
            className="px-3 py-1 rounded border"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200" role="alert">
          {error}
        </div>
      )}
      <div className="rounded border bg-background">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          table
        )}
      </div>
    </div>
  );
}



import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Ward } from '@/types/branch.types';

export const useWards = (subcountyId?: string) => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subcountyId) {
      setWards([]);
      return;
    }

    const fetchWards = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/wards/subcounty/${subcountyId}`);
        setWards(response.data.data);
      } catch (err) {
        setError('Failed to fetch wards');
      } finally {
        setLoading(false);
      }
    };

    fetchWards();
  }, [subcountyId]);

  return { wards, loading, error };
};
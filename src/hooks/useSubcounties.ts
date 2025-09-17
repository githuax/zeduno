import { useState, useEffect } from 'react';
import { api } from '@/utils/api';

export interface Subcounty {
  _id: string;
  name: string;
}

export const useSubcounties = () => {
  const [subcounties, setSubcounties] = useState<Subcounty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubcounties = async () => {
      setLoading(true);
      try {
        const response = await api.get('/subcounties');
        setSubcounties(response.data.data);
      } catch (err) {
        setError('Failed to fetch subcounties');
      } finally {
        setLoading(false);
      }
    };

    fetchSubcounties();
  }, []);

  return { subcounties, loading, error };
};
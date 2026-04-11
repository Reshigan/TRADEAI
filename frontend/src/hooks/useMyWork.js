import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export function useMyWork() {
  const [state, setState] = useState({
    promotions: [],
    approvals: [],
    customers: [],
    claims: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchMyWork() {
      setState(s => ({ ...s, loading: true }));
      try {
        const [promos, apps, custs, claims] = await Promise.all([
          apiClient.get('/my/promotions'),
          apiClient.get('/my/approvals'),
          apiClient.get('/my/customers'),
          apiClient.get('/my/claims'),
        ]);

        setState({
          promotions: promos.data,
          approvals: apps.data,
          customers: custs.data,
          claims: claims.data,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState(s => ({ ...s, loading: false, error: error.message }));
      }
    }

    fetchMyWork();
  }, []);

  return state;
}

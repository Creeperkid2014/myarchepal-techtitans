import { useState, useEffect } from 'react';
import { Site, SitesService } from '@/services/sites';
import { useAuth } from '@/hooks/use-auth';

export const useSites = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    initializeAndFetchSites();
  }, [isAuthenticated]); // Re-run when authentication state changes

  const initializeAndFetchSites = async () => {
    try {
      setLoading(true);

      // Fetch existing sites
      const data = await SitesService.getAllSites();
      setSites(data);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch sites');
      console.error('Error in initializeAndFetchSites:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      setLoading(true);
      const data = await SitesService.getAllSites();
      setSites(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createSite = async (siteData: Omit<Site, 'id'>) => {
    try {
      const siteId = await SitesService.createSite(siteData);
      await fetchSites(); // Refresh the list
      return siteId;
    } catch (err) {
      setError('Failed to create site');
      throw err;
    }
  };

  const updateSite = async (siteId: string, updates: Partial<Site>) => {
    try {
      await SitesService.updateSite(siteId, updates);
      await fetchSites(); // Refresh the list
    } catch (err) {
      setError('Failed to update site');
      throw err;
    }
  };

  const deleteSite = async (siteId: string) => {
    try {
      await SitesService.deleteSite(siteId);
      await fetchSites(); // Refresh the list
    } catch (err) {
      setError('Failed to delete site');
      throw err;
    }
  };

  return {
    sites,
    loading,
    error,
    fetchSites,
    createSite,
    updateSite,
    deleteSite
  };
};
import { useState } from 'react';
import apiClient from '../client';

export const useFetchData = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDataFromServer = async (endpoint: string) => {
        setLoading(true);
        try {
            const response = await apiClient.get(endpoint);

            // console.log('useFetchData Hook Response', response.data)

            setData(response.data);
            return response.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

  return { data, loading, error, fetchDataFromServer };
};

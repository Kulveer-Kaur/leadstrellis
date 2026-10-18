import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys';
import { fetchProperties, fetchProperty, type PropertyListParams } from '../api/properties.api';

export const useProperties = (params: PropertyListParams, enabled = true) =>
  useQuery({ queryKey: queryKeys.properties.list(params), queryFn: () => fetchProperties(params), placeholderData: (prev) => prev, enabled });

export const useProperty = (id: string) => useQuery({ queryKey: queryKeys.properties.detail(id), queryFn: () => fetchProperty(id) });

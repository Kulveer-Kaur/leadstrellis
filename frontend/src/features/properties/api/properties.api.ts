import { http } from '@/services/http';
import type { Property, PropertyDetail } from '@/types';

export interface PropertyListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  emirate?: string;
  community?: string;
  type?: string;
  listingType?: string;
  status?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export const fetchProperties = (params: PropertyListParams) => http.getPage<Property[]>('/properties', { ...params });

export const fetchProperty = (id: string) => http.get<PropertyDetail>(`/properties/${id}`);

export const createProperty = (data: any) => http.post<PropertyDetail>('/properties', data);

export const updateProperty = (id: string, data: any) => http.patch<PropertyDetail>(`/properties/${id}`, data);

export const uploadPropertyImage = (base64Data: string) =>
  http.post<{ url: string; filename: string }>('/media/upload', { data: base64Data });

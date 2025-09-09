import type { Admin } from '@/types/auth';
import apiClient from './client';

export async function loginApi(email: string, password: string): Promise<Admin> {
  await apiClient.post('/auth/login', { email, password });
  const res = await apiClient.get('/auth/me');
  return res.data as Admin;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMeApi(): Promise<Admin> {
  const res = await apiClient.get('/auth/me');
  return res.data as Admin;
}

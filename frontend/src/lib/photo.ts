import { BACKEND_URL } from '@/services/api';

export function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${BACKEND_URL}${photoUrl}`;
}
import React from 'react';
import FlatDetailClient from './FlatDetailClient';

export async function generateStaticParams() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/flats?sort=date');
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.length > 0) {
        const dbIds = json.data.map((f) => ({ id: String(f.id) }));
        const fallbacks = Array.from({ length: 30 }, (_, i) => ({ id: String(i + 1) }));
        const all = [...dbIds, ...fallbacks];
        const unique = Array.from(new Set(all.map((item) => item.id))).map((id) => ({ id }));
        return unique;
      }
    }
  } catch (e) {
    // Backend may not be reachable during build
  }
  return Array.from({ length: 30 }, (_, i) => ({ id: String(i + 1) }));
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <FlatDetailClient params={resolvedParams} />;
}

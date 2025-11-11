import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';

export default function Account() {
  const { user, token, fetchMe, clearAuth } = useAuth();
  const [me, setMe] = useState(user);

  useEffect(() => { (async () => { const data = await fetchMe(); if (data) setMe(data); })(); }, [token]);

  if (!token) return null;

  return (
    <div className="app-container" style={{ padding: 24 }}>
      <h2>Mi cuenta</h2>
      {me ? (
        <div style={{ marginTop: 12 }}>
          <div><b>Nombre:</b> {me.name}</div>
          <div><b>Email:</b> {me.email}</div>
        </div>
      ) : (
        <p>Cargando...</p>
      )}
      <button style={{ marginTop: 16 }} onClick={clearAuth}>Cerrar sesión</button>
    </div>
  );
}

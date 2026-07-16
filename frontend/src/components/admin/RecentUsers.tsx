'use client';

import { Avatar } from '@/components/ui/Avatar';

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  photo_url?: string;
  created_at: string;
}

interface RecentUsersProps {
  users: User[];
}

export function RecentUsers({ users }: RecentUsersProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className="recent-users">
      {users.map((user, idx) => (
        <div key={user.id} className="user-row" style={{ animationDelay: `${idx * 0.05}s` }}>
          <Avatar 
            photoUrl={user.photo_url} 
            prenom={user.prenom} 
            nom={user.nom} 
            size={36} 
          />
          <div className="user-info">
            <p className="user-name">{user.prenom} {user.nom}</p>
            <p className="user-email">{user.email}</p>
          </div>
          <div className="user-meta">
            <span className={`user-role-badge ${user.role}`}>
              {user.role === 'mentor' ? 'Mentor' : user.role === 'admin' ? 'Admin' : 'Mentoré'}
            </span>
            <span className="user-date">{formatDate(user.created_at)}</span>
          </div>
        </div>
      ))}

      <style jsx>{`
        .recent-users {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .user-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 12px;
          transition: all 0.2s ease;
          animation: fadeIn 0.4s ease forwards;
          opacity: 0;
        }
        .user-row:hover {
          background: var(--bg-secondary);
        }
        .user-info {
          flex: 1;
          min-width: 0;
        }
        .user-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-email {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .user-role-badge {
          font-size: 0.6rem;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 500;
        }
        .user-role-badge.mentor {
          background: var(--accent-soft);
          color: var(--accent-text-on-soft);
        }
        .user-role-badge.admin {
          background: rgba(139, 92, 246, 0.1);
          color: #8B5CF6;
        }
        .user-role-badge.mentore {
          background: var(--success-soft);
          color: var(--success);
        }
        .user-date {
          font-size: 0.6rem;
          color: var(--text-tertiary);
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
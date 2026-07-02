import { FileText, Users, MessageCircle, Search, Inbox, Calendar, Star } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: 'document' | 'users' | 'messages' | 'search' | 'inbox' | 'calendar' | 'star';
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

const icons = {
  document: FileText,
  users: Users,
  messages: MessageCircle,
  search: Search,
  inbox: Inbox,
  calendar: Calendar,
  star: Star,
};

export function EmptyState({ icon = 'document', title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];
  
  return (
    <div className="empty-state animate-fade-in-up">
      <div className="empty-state-icon">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <div className="empty-state-action">
          {action.href ? (
            <Link href={action.href} className="btn btn-primary">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="btn btn-primary">
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
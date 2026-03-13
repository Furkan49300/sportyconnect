import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Trophy } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const SPORT_ICONS = {
  'Tennis': '🎾', 'Football': '⚽', 'Futsal': '⚽', 'Basketball': '🏀',
  'Volleyball': '🏐', 'Cyclisme': '🚴', 'Course à pied': '🏃', 'Badminton': '🏸',
  'Padel': '🎾', 'Escalade': '🧗', 'Randonnée': '🥾'
};

export default function ActivityCard({ activity }) {
  const icon = SPORT_ICONS[activity.sport] || '🏅';
  const spotsLeft = activity.max_participants - (activity.participant_count || 0);
  const isFull = spotsLeft <= 0;

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  return (
    <Link to={`/activities/${activity.activity_id}`} data-testid={`activity-card-${activity.activity_id}`}>
      <div className="card-sport bg-white border border-gray-100 overflow-hidden group cursor-pointer">
        {/* Image/Header */}
        <div className="relative h-40 bg-gray-50 overflow-hidden">
          {activity.image_url ? (
            <img src={getImageUrl(activity.image_url)} alt={activity.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <span className="text-5xl">{icon}</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className="bg-carbon text-white font-heading text-[10px] tracking-wider px-2 py-1 rounded-none border-0">{activity.sport}</Badge>
          </div>
          {isFull && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-500 text-white font-heading text-[10px] tracking-wider px-2 py-1 rounded-none border-0">COMPLET</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-heading text-lg font-bold tracking-tight line-clamp-1">{activity.title}</h3>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="font-body text-xs truncate">{activity.location}, {activity.city}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="font-body text-xs">{activity.date}</span>
              <Clock className="w-3.5 h-3.5 shrink-0 ml-2" />
              <span className="font-body text-xs">{activity.time}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-heading text-xs font-bold">{activity.participant_count || 0}/{activity.max_participants}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-body text-xs text-gray-500">{activity.required_level}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getActivities } from '../lib/api';
import ActivityCard from '../components/ActivityCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Search, Filter, X } from 'lucide-react';
import { motion } from 'framer-motion';

const SPORTS = ["Tennis", "Football", "Futsal", "Basketball", "Volleyball", "Cyclisme", "Course à pied", "Badminton", "Padel", "Escalade", "Randonnée"];

export default function Activities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sport, setSport] = useState(searchParams.get('sport') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (sport) params.sport = sport;
      if (city) params.city = city;
      if (date) params.date = date;
      const res = await getActivities(params);
      setActivities(res.data.activities);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sport, city, date]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  useEffect(() => {
    const params = {};
    if (sport) params.sport = sport;
    if (city) params.city = city;
    if (date) params.date = date;
    setSearchParams(params, { replace: true });
  }, [sport, city, date, setSearchParams]);

  const clearFilters = () => { setSport(''); setCity(''); setDate(''); setPage(1); };
  const hasFilters = sport || city || date;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-carbon noise-overlay py-12 lg:py-16 px-4">
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tighter" data-testid="activities-title">
            TROUVEZ VOTRE <span className="text-volt">ACTIVITÉ</span>
          </h1>
          <p className="font-body text-sm text-gray-400 mt-2">Parcourez et rejoignez des activités sportives près de chez vous</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 py-4 px-4 sticky top-16 z-40" data-testid="activities-filters">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="font-body text-xs font-medium uppercase tracking-wider">Filtres</span>
          </div>
          <Select value={sport} onValueChange={(v) => { setSport(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-44 h-10 rounded-none font-body text-sm" data-testid="filter-sport">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sports</SelectItem>
              {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Ville..."
              value={city}
              onChange={(e) => { setCity(e.target.value); setPage(1); }}
              className="pl-9 h-10 w-40 rounded-none font-body text-sm"
              data-testid="filter-city"
            />
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
            className="h-10 w-44 rounded-none font-body text-sm"
            data-testid="filter-date"
          />
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-body text-gray-500 hover:text-carbon" data-testid="clear-filters">
              <X className="w-3 h-3" /> Effacer
            </button>
          )}
        </div>
      </div>

      {/* Activities Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 h-72 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20" data-testid="no-activities">
            <p className="font-heading text-2xl font-bold text-gray-300 tracking-tighter">AUCUNE ACTIVITÉ TROUVÉE</p>
            <p className="font-body text-sm text-gray-400 mt-2">Essayez d'ajuster vos filtres ou créez une nouvelle activité !</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((a, i) => (
                <motion.div
                  key={a.activity_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <ActivityCard activity={a} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10" data-testid="pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-10 px-4 font-heading text-xs font-bold tracking-wider border-2 border-carbon disabled:border-gray-200 disabled:text-gray-300 hover:bg-carbon hover:text-white transition-colors"
                  data-testid="pagination-prev"
                >
                  PRÉC
                </button>
                <span className="font-heading text-sm font-bold px-4">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-10 px-4 font-heading text-xs font-bold tracking-wider border-2 border-carbon disabled:border-gray-200 disabled:text-gray-300 hover:bg-carbon hover:text-white transition-colors"
                  data-testid="pagination-next"
                >
                  SUIV
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

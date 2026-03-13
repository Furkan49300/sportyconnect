import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboard, deleteActivity } from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, MapPin, Users, Clock, Trophy, Plus, Trash2, Star, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const fetchDashboard = async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleDelete = async (activityId) => {
    if (!window.confirm('Supprimer cette activité ?')) return;
    try {
      await deleteActivity(activityId);
      toast.success('Activité supprimée');
      fetchDashboard();
    } catch (err) { toast.error(err.response?.data?.detail || 'Impossible de supprimer'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-carbon border-t-volt animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50" data-testid="dashboard-page">
      <div className="bg-carbon noise-overlay py-10 lg:py-14 px-4">
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tighter" data-testid="dashboard-title">
            VOTRE <span className="text-volt">TABLEAU DE BORD</span>
          </h1>
          <p className="font-body text-sm text-gray-400 mt-2">Bon retour, {user?.name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-testid="dashboard-stats">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 p-5">
            <p className="font-body text-xs text-gray-500 uppercase tracking-wider">Créées</p>
            <p className="font-heading text-3xl font-extrabold mt-1">{data?.total_created || 0}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 p-5">
            <p className="font-body text-xs text-gray-500 uppercase tracking-wider">Rejointes</p>
            <p className="font-heading text-3xl font-extrabold mt-1">{data?.total_joined || 0}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-100 p-5">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-volt text-volt" />
              <p className="font-body text-xs text-gray-500 uppercase tracking-wider">Note</p>
            </div>
            <p className="font-heading text-3xl font-extrabold mt-1">{data?.average_rating || '—'}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-gray-100 p-5">
            <p className="font-body text-xs text-gray-500 uppercase tracking-wider">Avis</p>
            <p className="font-heading text-3xl font-extrabold mt-1">{data?.total_ratings || 0}</p>
          </motion.div>
        </div>

        {/* CTA */}
        <Link to="/create" data-testid="dashboard-create-btn">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-carbon text-white p-6 flex items-center justify-between mb-8 group cursor-pointer hover:shadow-[4px_4px_0px_0px_#CCFF00] transition-all duration-300 hover:-translate-y-1">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight">CRÉER UNE NOUVELLE ACTIVITÉ</h2>
              <p className="font-body text-xs text-gray-400 mt-1">Organisez un match et trouvez votre équipe</p>
            </div>
            <div className="w-12 h-12 bg-volt flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
              <Plus className="w-5 h-5 text-carbon" />
            </div>
          </motion.div>
        </Link>

        {/* Tabs */}
        <Tabs defaultValue="created" className="w-full" data-testid="dashboard-tabs">
          <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-auto p-0 gap-0">
            <TabsTrigger value="created" className="rounded-none border-b-2 border-transparent data-[state=active]:border-carbon data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-heading text-xs font-bold tracking-wider" data-testid="tab-created">
              MES ACTIVITÉS ({data?.total_created || 0})
            </TabsTrigger>
            <TabsTrigger value="joined" className="rounded-none border-b-2 border-transparent data-[state=active]:border-carbon data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-heading text-xs font-bold tracking-wider" data-testid="tab-joined">
              REJOINTES ({data?.total_joined || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="mt-6">
            {data?.created_activities?.length === 0 ? (
              <EmptyState text="Vous n'avez créé aucune activité" />
            ) : (
              <div className="space-y-3">
                {data?.created_activities?.map((a, i) => (
                  <ActivityRow key={a.activity_id} activity={a} isCreator onDelete={handleDelete} getImageUrl={getImageUrl} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="joined" className="mt-6">
            {data?.joined_activities?.length === 0 ? (
              <EmptyState text="Vous n'avez rejoint aucune activité" />
            ) : (
              <div className="space-y-3">
                {data?.joined_activities?.map((a, i) => (
                  <ActivityRow key={a.activity_id} activity={a} getImageUrl={getImageUrl} index={i} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ActivityRow({ activity, isCreator, onDelete, getImageUrl, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      data-testid={`dashboard-activity-${activity.activity_id}`}
    >
      <Link to={`/activities/${activity.activity_id}`} className="block">
        <div className="bg-white border border-gray-100 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-carbon/20 hover:shadow-sm transition-all group">
          <div className="w-full sm:w-16 h-16 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
            {activity.image_url ? (
              <img src={getImageUrl(activity.image_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <Activity className="w-6 h-6 text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-gray-100 text-gray-700 font-heading text-[10px] tracking-wider px-2 py-0.5 rounded-none border-0">{activity.sport}</Badge>
              <Badge className={`font-heading text-[10px] tracking-wider px-2 py-0.5 rounded-none border-0 ${activity.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{activity.status?.toUpperCase()}</Badge>
            </div>
            <h3 className="font-heading text-base font-bold tracking-tight truncate">{activity.title}</h3>
            <div className="flex flex-wrap gap-3 mt-1">
              <span className="flex items-center gap-1 font-body text-xs text-gray-500"><MapPin className="w-3 h-3" />{activity.city}</span>
              <span className="flex items-center gap-1 font-body text-xs text-gray-500"><Calendar className="w-3 h-3" />{activity.date}</span>
              <span className="flex items-center gap-1 font-body text-xs text-gray-500"><Clock className="w-3 h-3" />{activity.time}</span>
              <span className="flex items-center gap-1 font-body text-xs text-gray-500"><Users className="w-3 h-3" />{activity.participant_count}/{activity.max_participants}</span>
            </div>
          </div>
          {isCreator && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(activity.activity_id); }}
              className="shrink-0 w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              data-testid={`delete-${activity.activity_id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-16" data-testid="empty-state">
      <Activity className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="font-heading text-lg font-bold text-gray-300 tracking-tighter">{text}</p>
      <Link to="/activities" className="font-body text-sm text-electric hover:underline mt-2 inline-block">Parcourir les activités</Link>
    </div>
  );
}

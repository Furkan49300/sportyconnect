import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActivity, joinActivity, leaveActivity, getMessages, sendMessage, ratePlayer, getActivityRatings, deleteActivity, getWsUrl } from '../lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar, MapPin, Users, Clock, Trophy, Send, Star, Trash2, MessageCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const SPORT_ICONS = {
  'Tennis': '🎾', 'Football': '⚽', 'Futsal': '⚽', 'Basketball': '🏀',
  'Volleyball': '🏐', 'Cyclisme': '🚴', 'Course à pied': '🏃', 'Badminton': '🏸',
  'Padel': '🎾', 'Escalade': '🧗', 'Randonnée': '🥾'
};

export default function ActivityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [rateScore, setRateScore] = useState('5');
  const [rateComment, setRateComment] = useState('');
  const [rateUserId, setRateUserId] = useState('');
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const fetchActivity = useCallback(async () => {
    try {
      const res = await getActivity(id);
      setActivity(res.data);
    } catch { toast.error('Activité introuvable'); navigate('/activities'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await getMessages(id);
      setMessages(res.data);
    } catch { /* ignore */ }
  }, [id]);

  const fetchRatings = useCallback(async () => {
    try {
      const res = await getActivityRatings(id);
      setRatings(res.data);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { fetchActivity(); fetchMessages(); fetchRatings(); }, [fetchActivity, fetchMessages, fetchRatings]);

  // WebSocket connection
  useEffect(() => {
    if (!user || !chatOpen) return;
    const wsUrl = getWsUrl(id);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages(prev => {
        if (prev.find(m => m.message_id === msg.message_id)) return prev;
        return [...prev, msg];
      });
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => { ws.close(); };
  }, [user, id, chatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isCreator = user && activity?.creator_id === user.user_id;
  const isParticipant = user && activity?.participants?.includes(user.user_id);
  const isFull = activity && (activity.participant_count >= activity.max_participants);

  const handleJoin = async () => {
    try {
      await joinActivity(id);
      toast.success('Vous avez rejoint l\'activité !');
      fetchActivity();
    } catch (err) { toast.error(err.response?.data?.detail || 'Impossible de rejoindre'); }
  };

  const handleLeave = async () => {
    try {
      await leaveActivity(id);
      toast.success('Vous avez quitté l\'activité');
      fetchActivity();
    } catch (err) { toast.error(err.response?.data?.detail || 'Impossible de quitter'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette activité ?')) return;
    try {
      await deleteActivity(id);
      toast.success('Activité supprimée');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.detail || 'Impossible de supprimer'); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        user_id: user.user_id,
        user_name: user.name,
        user_picture: user.picture,
        content: newMessage.trim()
      }));
    } else {
      await sendMessage(id, newMessage.trim());
      fetchMessages();
    }
    setNewMessage('');
  };

  const handleRate = async () => {
    if (!rateUserId) return;
    try {
      await ratePlayer(id, { rated_id: rateUserId, score: parseInt(rateScore), comment: rateComment });
      toast.success('Note envoyée !');
      setRateComment('');
      setRateUserId('');
      fetchRatings();
    } catch (err) { toast.error(err.response?.data?.detail || 'Impossible de noter'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-carbon border-t-volt animate-spin" /></div>;
  if (!activity) return null;

  const icon = SPORT_ICONS[activity.sport] || '🏅';

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Header */}
      <div className="bg-carbon noise-overlay relative overflow-hidden" data-testid="activity-detail-header">
        <div className="max-w-7xl mx-auto px-4 py-10 lg:py-14 relative z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 font-body text-sm transition-colors" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-volt text-carbon font-heading text-xs tracking-wider px-3 py-1 rounded-none border-0">{activity.sport}</Badge>
                <Badge className="bg-white/10 text-white font-heading text-xs tracking-wider px-3 py-1 rounded-none border-0">{activity.required_level}</Badge>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tighter">{activity.title}</h1>
              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-volt" />
                  <span className="font-body text-sm">{activity.location}, {activity.city}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-volt" />
                  <span className="font-body text-sm">{activity.date}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4 text-volt" />
                  <span className="font-body text-sm">{activity.time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4 text-volt" />
                  <span className="font-heading text-sm font-bold">{activity.participant_count}/{activity.max_participants}</span>
                </div>
              </div>
            </div>
            {activity.image_url && (
              <div className="w-full lg:w-64 h-40 lg:h-auto overflow-hidden">
                <img src={getImageUrl(activity.image_url)} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 p-6" data-testid="activity-description">
              <h2 className="font-heading text-lg font-bold tracking-tight mb-3">À PROPOS DE CETTE ACTIVITÉ</h2>
              <p className="font-body text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{activity.description}</p>
            </motion.div>

            {/* Participants */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 p-6" data-testid="participants-section">
              <h2 className="font-heading text-lg font-bold tracking-tight mb-4">PARTICIPANTS ({activity.participant_count}/{activity.max_participants})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(activity.participants_details || []).map((p) => (
                  <div key={p.user_id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100" data-testid={`participant-${p.user_id}`}>
                    <Avatar className="h-9 w-9 border border-gray-200">
                      <AvatarImage src={getImageUrl(p.picture)} />
                      <AvatarFallback className="bg-carbon text-volt font-heading text-xs">{p.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold truncate">{p.name}</p>
                      <p className="font-body text-xs text-gray-400">{p.athletic_level || 'Débutant'}</p>
                    </div>
                    {p.user_id === activity.creator_id && (
                      <Badge className="bg-volt text-carbon font-heading text-[10px] px-2 py-0.5 rounded-none border-0">ORGANISATEUR</Badge>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Chat Section */}
            {isParticipant && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-100" data-testid="chat-section">
                <button onClick={() => setChatOpen(!chatOpen)} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors" data-testid="chat-toggle">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <h2 className="font-heading text-lg font-bold tracking-tight">CHAT DE GROUPE</h2>
                  </div>
                  <Badge className="bg-carbon text-white font-heading text-[10px] px-2 py-0.5 rounded-none border-0">{messages.length}</Badge>
                </button>
                {chatOpen && (
                  <div className="border-t border-gray-100">
                    <div className="h-80 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
                      {messages.length === 0 && <p className="text-center font-body text-sm text-gray-400 py-8">Aucun message. Lancez la conversation !</p>}
                      {messages.map((msg) => (
                        <div key={msg.message_id} className={`flex gap-2 ${msg.user_id === user?.user_id ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="h-7 w-7 shrink-0 border border-gray-200">
                            <AvatarImage src={getImageUrl(msg.user_picture)} />
                            <AvatarFallback className="bg-carbon text-volt text-[10px] font-heading">{msg.user_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[70%] ${msg.user_id === user?.user_id ? 'bg-carbon text-white' : 'bg-gray-100'} px-3 py-2`}>
                            <p className="font-body text-[10px] font-semibold mb-0.5 opacity-70">{msg.user_name}</p>
                            <p className="font-body text-sm">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2" data-testid="chat-form">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrire un message..."
                        className="flex-1 h-10 rounded-none font-body text-sm"
                        data-testid="chat-input"
                      />
                      <button type="submit" className="btn-volt h-10 w-10 flex items-center justify-center shrink-0" data-testid="chat-send">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {/* Ratings */}
            {isParticipant && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-gray-100 p-6" data-testid="ratings-section">
                <h2 className="font-heading text-lg font-bold tracking-tight mb-4">NOTER LES JOUEURS</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Select value={rateUserId} onValueChange={setRateUserId}>
                    <SelectTrigger className="w-48 h-10 rounded-none font-body text-sm" data-testid="rate-player-select">
                      <SelectValue placeholder="Choisir un joueur" />
                    </SelectTrigger>
                    <SelectContent>
                      {(activity.participants_details || []).filter(p => p.user_id !== user?.user_id).map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={rateScore} onValueChange={setRateScore}>
                    <SelectTrigger className="w-28 h-10 rounded-none font-body text-sm" data-testid="rate-score-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(s => <SelectItem key={s} value={String(s)}>{s} Étoile{s > 1 ? 's' : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={rateComment} onChange={(e) => setRateComment(e.target.value)} placeholder="Commentaire (optionnel)" className="flex-1 h-10 rounded-none font-body text-sm min-w-[200px]" data-testid="rate-comment" />
                  <button onClick={handleRate} className="btn-volt h-10 px-6 text-xs font-heading font-bold tracking-wider" data-testid="rate-submit">NOTER</button>
                </div>
                {ratings.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {ratings.map(r => (
                      <div key={r.rating_id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.score ? 'fill-volt text-volt' : 'text-gray-300'}`} />)}
                        </div>
                        <span className="font-body text-xs"><span className="font-semibold">{r.rater_name}</span> a noté <span className="font-semibold">{r.rated_name}</span></span>
                        {r.comment && <span className="font-body text-xs text-gray-500 italic">"{r.comment}"</span>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white border border-gray-100 p-6 sticky top-24" data-testid="activity-action-card">
              <div className="text-center mb-6">
                <span className="text-5xl">{icon}</span>
                <p className="font-heading text-2xl font-bold tracking-tight mt-2">{activity.sport}</p>
              </div>

              {/* Creator */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 mb-4">
                <Avatar className="h-10 w-10 border border-gray-200">
                  <AvatarImage src={getImageUrl(activity.creator_picture)} />
                  <AvatarFallback className="bg-carbon text-volt font-heading text-sm">{activity.creator_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-body text-sm font-semibold">{activity.creator_name}</p>
                  <p className="font-body text-xs text-gray-400">Organisateur</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-body text-xs text-gray-500">Places restantes</span>
                  <span className="font-heading text-sm font-bold">{Math.max(0, activity.max_participants - activity.participant_count)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body text-xs text-gray-500">Niveau</span>
                  <span className="font-heading text-sm font-bold">{activity.required_level}</span>
                </div>
                <div className="w-full bg-gray-100 h-2">
                  <div className="bg-volt h-2 transition-all duration-500" style={{ width: `${(activity.participant_count / activity.max_participants) * 100}%` }} />
                </div>
              </div>

              {user ? (
                <div className="space-y-2">
                  {isCreator ? (
                    <button onClick={handleDelete} className="w-full h-12 flex items-center justify-center gap-2 font-heading text-xs font-bold tracking-wider border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors" data-testid="delete-activity-btn">
                      <Trash2 className="w-4 h-4" /> SUPPRIMER L'ACTIVITÉ
                    </button>
                  ) : isParticipant ? (
                    <button onClick={handleLeave} className="w-full h-12 font-heading text-xs font-bold tracking-wider border-2 border-carbon hover:bg-carbon hover:text-white transition-colors" data-testid="leave-activity-btn">
                      QUITTER L'ACTIVITÉ
                    </button>
                  ) : isFull ? (
                    <button disabled className="w-full h-12 font-heading text-xs font-bold tracking-wider bg-gray-200 text-gray-400 cursor-not-allowed" data-testid="full-activity-btn">
                      ACTIVITÉ COMPLÈTE
                    </button>
                  ) : (
                    <button onClick={handleJoin} className="w-full btn-volt h-12 font-heading text-xs font-bold tracking-wider" data-testid="join-activity-btn">
                      REJOINDRE L'ACTIVITÉ
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    const redirectUrl = window.location.pathname;
                    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/login/google?redirect=${encodeURIComponent(redirectUrl)}`;
                  }}
                  className="w-full btn-volt h-12 font-heading text-xs font-bold tracking-wider"
                  data-testid="login-to-join-btn"
                >
                  CONNECTEZ-VOUS POUR REJOINDRE
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

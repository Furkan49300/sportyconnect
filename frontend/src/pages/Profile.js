import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, uploadProfilePhoto, getUserRatings } from '../lib/api';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Camera, Star, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const SPORTS = ["Tennis", "Football", "Futsal", "Basketball", "Volleyball", "Cyclisme", "Course à pied", "Badminton", "Padel", "Escalade", "Randonnée"];
const LEVELS = ["Débutant", "Amateur", "Intermédiaire", "Avancé", "Expert"];

export default function Profile() {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState({ average: 0, count: 0 });
  const [form, setForm] = useState({
    name: '', age: '', city: '', bio: '', favorite_sports: [], athletic_level: 'Débutant'
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        age: user.age || '',
        city: user.city || '',
        bio: user.bio || '',
        favorite_sports: user.favorite_sports || [],
        athletic_level: user.athletic_level || 'Débutant'
      });
      getUserRatings(user.user_id).then(res => setRatings(res.data)).catch(() => {});
    }
  }, [user]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleSport = (sport) => {
    setForm(prev => ({
      ...prev,
      favorite_sports: prev.favorite_sports.includes(sport)
        ? prev.favorite_sports.filter(s => s !== sport)
        : [...prev.favorite_sports, sport]
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await uploadProfilePhoto(fd);
      toast.success('Photo mise à jour !');
      checkAuth();
    } catch { toast.error('Impossible de télécharger la photo'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, age: form.age ? parseInt(form.age) : null };
      await updateProfile(data);
      toast.success('Profil mis à jour !');
      checkAuth();
    } catch { toast.error('Impossible de mettre à jour le profil'); }
    finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-carbon noise-overlay py-10 lg:py-14 px-4">
        <div className="max-w-3xl mx-auto relative z-10">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tighter" data-testid="profile-title">
            VOTRE <span className="text-volt">PROFIL</span>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="bg-white border border-gray-100 p-6 mb-6 flex flex-col sm:flex-row items-center gap-6" data-testid="profile-header">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-carbon">
                <AvatarImage src={getImageUrl(user.picture)} />
                <AvatarFallback className="bg-carbon text-volt font-heading text-3xl">{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-volt flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" data-testid="photo-upload">
                <Camera className="w-4 h-4 text-carbon" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="font-heading text-2xl font-bold tracking-tight">{user.name}</h2>
              <p className="font-body text-sm text-gray-500">{user.email}</p>
              {ratings.count > 0 && (
                <div className="flex items-center gap-1 mt-2 justify-center sm:justify-start">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(ratings.average) ? 'fill-volt text-volt' : 'text-gray-300'}`} />)}
                  <span className="font-heading text-sm font-bold ml-1">{ratings.average}</span>
                  <span className="font-body text-xs text-gray-400">({ratings.count})</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-6 lg:p-8 space-y-6" data-testid="profile-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">NOM</Label>
                <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="h-12 rounded-none font-body" data-testid="profile-name" />
              </div>
              <div>
                <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">ÂGE</Label>
                <Input type="number" value={form.age} onChange={(e) => handleChange('age', e.target.value)} className="h-12 rounded-none font-body" data-testid="profile-age" />
              </div>
            </div>

            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">VILLE</Label>
              <Input value={form.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Votre ville" className="h-12 rounded-none font-body" data-testid="profile-city" />
            </div>

            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">BIO</Label>
              <Textarea value={form.bio} onChange={(e) => handleChange('bio', e.target.value)} placeholder="Parlez de vous aux autres sportifs..." className="rounded-none font-body min-h-[100px]" data-testid="profile-bio" />
            </div>

            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">NIVEAU SPORTIF</Label>
              <Select value={form.athletic_level} onValueChange={(v) => handleChange('athletic_level', v)}>
                <SelectTrigger className="h-12 rounded-none font-body w-full sm:w-64" data-testid="profile-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-3 block">SPORTS FAVORIS</Label>
              <div className="flex flex-wrap gap-2" data-testid="profile-sports">
                {SPORTS.map(sport => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`px-4 py-2 font-heading text-xs font-bold tracking-wider transition-all duration-200 ${
                      form.favorite_sports.includes(sport)
                        ? 'bg-carbon text-volt'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    data-testid={`sport-tag-${sport}`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-volt h-12 px-8 text-sm font-heading font-bold tracking-wider flex items-center gap-2 disabled:opacity-50" data-testid="profile-save">
              <Save className="w-4 h-4" /> {loading ? 'SAUVEGARDE...' : 'SAUVEGARDER'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

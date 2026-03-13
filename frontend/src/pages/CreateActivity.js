import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createActivity, uploadFile } from '../lib/api';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Upload, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const SPORTS = ["Tennis", "Football", "Futsal", "Basketball", "Volleyball", "Cyclisme", "Course à pied", "Badminton", "Padel", "Escalade", "Randonnée"];
const LEVELS = ["Débutant", "Amateur", "Intermédiaire", "Avancé", "Expert"];

export default function CreateActivity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    sport: '', title: '', description: '', location: '', city: '',
    date: '', time: '', max_participants: 10, required_level: 'Débutant', image_url: ''
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sport || !form.title || !form.location || !form.city || !form.date || !form.time) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const uploadRes = await uploadFile(fd);
        imageUrl = uploadRes.data.url;
      }
      const res = await createActivity({ ...form, image_url: imageUrl });
      toast.success('Activité créée !');
      navigate(`/activities/${res.data.activity_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Impossible de créer l\'activité');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-carbon noise-overlay py-10 lg:py-14 px-4">
        <div className="max-w-3xl mx-auto relative z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 font-body text-sm transition-colors" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tighter" data-testid="create-title">
            CRÉER UNE <span className="text-volt">ACTIVITÉ</span>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 p-6 lg:p-8 space-y-6"
          data-testid="create-activity-form"
        >
          {/* Sport & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">SPORT *</Label>
              <Select value={form.sport} onValueChange={(v) => handleChange('sport', v)}>
                <SelectTrigger className="h-12 rounded-none font-body" data-testid="create-sport">
                  <SelectValue placeholder="Choisir un sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">NIVEAU REQUIS</Label>
              <Select value={form.required_level} onValueChange={(v) => handleChange('required_level', v)}>
                <SelectTrigger className="h-12 rounded-none font-body" data-testid="create-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">TITRE *</Label>
            <Input value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="ex. Futsal dimanche 18h" className="h-12 rounded-none font-body" data-testid="create-title-input" />
          </div>

          {/* Description */}
          <div>
            <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">DESCRIPTION</Label>
            <Textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Décrivez votre activité, ce qu'il faut apporter, etc." className="rounded-none font-body min-h-[120px]" data-testid="create-description" />
          </div>

          {/* Location & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">LIEU *</Label>
              <Input value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Nom du lieu ou adresse" className="h-12 rounded-none font-body" data-testid="create-location" />
            </div>
            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">VILLE *</Label>
              <Input value={form.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Ville" className="h-12 rounded-none font-body" data-testid="create-city" />
            </div>
          </div>

          {/* Date, Time, Max Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">DATE *</Label>
              <Input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} className="h-12 rounded-none font-body" data-testid="create-date" />
            </div>
            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">HEURE *</Label>
              <Input type="time" value={form.time} onChange={(e) => handleChange('time', e.target.value)} className="h-12 rounded-none font-body" data-testid="create-time" />
            </div>
            <div>
              <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">JOUEURS MAX</Label>
              <Input type="number" min={2} max={100} value={form.max_participants} onChange={(e) => handleChange('max_participants', parseInt(e.target.value) || 10)} className="h-12 rounded-none font-body" data-testid="create-max-participants" />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="font-heading text-xs font-bold tracking-wider mb-2 block">IMAGE DE L'ACTIVITÉ</Label>
            <div className="border-2 border-dashed border-gray-200 p-6 text-center">
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto object-cover" />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="font-body text-xs text-red-500">Supprimer</button>
                </div>
              ) : (
                <label className="cursor-pointer space-y-2 block" data-testid="create-image-upload">
                  <Upload className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="font-body text-sm text-gray-400">Cliquez pour télécharger une image</p>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-volt w-full h-14 text-sm font-heading font-bold tracking-wider disabled:opacity-50" data-testid="create-submit">
            {loading ? 'CRÉATION...' : 'CRÉER L\'ACTIVITÉ'}
          </button>
        </motion.form>
      </div>
    </div>
  );
}

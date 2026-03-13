import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Users, MessageCircle, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const SPORTS_LIST = [
  { name: 'Tennis', emoji: '🎾' }, { name: 'Football', emoji: '⚽' },
  { name: 'Basketball', emoji: '🏀' }, { name: 'Volleyball', emoji: '🏐' },
  { name: 'Cyclisme', emoji: '🚴' }, { name: 'Course à pied', emoji: '🏃' },
  { name: 'Badminton', emoji: '🏸' }, { name: 'Padel', emoji: '🎾' },
  { name: 'Escalade', emoji: '🧗' }, { name: 'Randonnée', emoji: '🥾' },
  { name: 'Futsal', emoji: '⚽' },
];

const FEATURES = [
  { icon: Users, title: 'TROUVEZ VOTRE ÉQUIPE', desc: 'Connectez-vous avec des sportifs locaux partageant votre passion et votre niveau.' },
  { icon: MessageCircle, title: 'CHAT EN DIRECT', desc: 'Coordonnez-vous avec votre équipe grâce à la messagerie de groupe intégrée.' },
  { icon: Target, title: 'MATCHING DE NIVEAU', desc: 'Trouvez des activités qui correspondent parfaitement à votre niveau sportif.' },
  { icon: Zap, title: 'INSCRIPTION INSTANTANÉE', desc: 'Rejoignez des activités en un clic. Sans complications, sans attente.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1744959438109-714e5d853a43?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwzfHxzb2NjZXIlMjBiYXNrZXRiYWxsJTIwdGVubmlzJTIwdm9sbGV5YmFsbCUyMGN5Y2xpbmclMjBoaWtpbmclMjBhY3Rpb258ZW58MHx8fHwxNzczMzkyMTkxfDA&ixlib=rb-4.1.0&q=85"
            alt="Sports en action"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-heading text-5xl sm:text-7xl lg:text-8xl font-extrabold text-white tracking-tighter leading-none"
          >
            TROUVEZ VOTRE ÉQUIPE<br />
            <span className="text-volt">JOUEZ VOTRE MATCH</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-body text-base md:text-lg text-gray-300 mt-6 max-w-xl mx-auto"
          >
            Rejoignez des activités sportives locales ou créez les vôtres. Connectez-vous avec des sportifs près de chez vous.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            {user ? (
              <Link to="/activities" data-testid="hero-browse-btn">
                <button className="btn-volt h-14 px-10 text-sm font-heading font-bold tracking-wider flex items-center gap-2 mx-auto">
                  PARCOURIR LES ACTIVITÉS <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : (
              <button
                onClick={() => {
                  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
                  const redirectUrl = window.location.origin + '/dashboard';
                  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
                }}
                className="btn-volt h-14 px-10 text-sm font-heading font-bold tracking-wider flex items-center gap-2 mx-auto"
                data-testid="hero-join-btn"
              >
                REJOINDRE L'ÉQUIPE <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <Link to="/activities" data-testid="hero-explore-btn">
              <button className="h-14 px-10 text-sm font-heading font-bold tracking-wider border-2 border-white text-white hover:bg-white hover:text-carbon transition-all duration-300 flex items-center gap-2 mx-auto">
                EXPLORER LES ACTIVITÉS
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Sports Marquee */}
      <section className="bg-carbon py-6 overflow-hidden" data-testid="sports-marquee">
        <div className="flex animate-marquee gap-8 whitespace-nowrap">
          {[...SPORTS_LIST, ...SPORTS_LIST].map((sport, i) => (
            <Link to={`/activities?sport=${sport.name}`} key={i} className="flex items-center gap-2 shrink-0 group cursor-pointer">
              <span className="text-2xl">{sport.emoji}</span>
              <span className="font-heading text-sm font-bold text-gray-400 group-hover:text-volt transition-colors tracking-wider">{sport.name.toUpperCase()}</span>
            </Link>
          ))}
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 30s linear infinite; }
          .animate-marquee:hover { animation-play-state: paused; }
        `}</style>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28 px-4 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter">COMMENT ÇA MARCHE</h2>
            <p className="font-body text-base text-gray-500 mt-3 max-w-lg mx-auto">Tout ce qu'il vous faut pour organiser et rejoindre des activités sportives en groupe.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white border border-gray-100 p-8 group hover:border-carbon transition-colors duration-300 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-carbon flex items-center justify-center mb-6 group-hover:bg-volt transition-colors duration-300">
                  <f.icon className="w-5 h-5 text-volt group-hover:text-carbon transition-colors duration-300" />
                </div>
                <h3 className="font-heading text-lg font-bold tracking-tight mb-2">{f.title}</h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-carbon noise-overlay py-20 lg:py-28 px-4" data-testid="cta-section">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tighter leading-none">
            PRÊT À <span className="text-volt">JOUER ?</span>
          </h2>
          <p className="font-body text-base text-gray-400 mt-4 max-w-lg mx-auto">
            Rejoignez des centaines de sportifs qui trouvent leur équipe chaque jour.
          </p>
          <div className="mt-10">
            {user ? (
              <Link to="/create" data-testid="cta-create-btn">
                <button className="btn-volt h-14 px-10 text-sm font-heading font-bold tracking-wider">
                  CRÉER UNE ACTIVITÉ
                </button>
              </Link>
            ) : (
              <button
                onClick={() => {
                  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
                  const redirectUrl = window.location.origin + '/dashboard';
                  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
                }}
                className="btn-volt h-14 px-10 text-sm font-heading font-bold tracking-wider"
                data-testid="cta-signup-btn"
              >
                COMMENCER MAINTENANT
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-carbon border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-heading text-sm font-bold text-gray-500 tracking-wider">SPORTSQUAD</span>
          <span className="font-body text-xs text-gray-600">Connectez. Jouez. Rivalisez.</span>
        </div>
      </footer>
    </div>
  );
}

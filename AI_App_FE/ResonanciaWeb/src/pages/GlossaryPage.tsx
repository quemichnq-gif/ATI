import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES, searchGlossary, type GlossaryTerm } from '../constants/glossary';
import UiIcon from '../components/UiIcon';

export default function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<GlossaryTerm | null>(null);

  const filtered = searchGlossary(query).filter(t =>
    category === 'all' || t.category === category
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display">
          📖 Từ Điển Chiêm Tinh
        </h1>
        <p className="text-purple-300 opacity-70 mt-1">
          Giải thích các thuật ngữ chiêm tinh học thường gặp
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm thuật ngữ... (vd: retrograde, trine...)"
          className="w-full glass px-4 py-3 pl-10 rounded-xl text-white placeholder-purple-400/60 outline-none border border-purple-500/20 focus:border-purple-400/50 transition-colors"
          aria-label="Tìm kiếm thuật ngữ chiêm tinh"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
          <UiIcon name="search" label="Tìm kiếm" />
        </span>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {GLOSSARY_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              category === c.id
                ? 'bg-purple-600/50 text-white border border-purple-400/50'
                : 'glass text-purple-300 hover:text-white border border-transparent'
            }`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Term grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((term, i) => (
            <motion.button
              key={term.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(term === selected ? null : term)}
              className={`glass-card p-4 text-left transition-all hover:border-purple-400/40 ${
                selected?.id === term.id ? 'border-purple-400/50 bg-purple-900/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{term.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-sm">{term.term}</h3>
                    {term.symbol && (
                      <span className="text-purple-300 text-xs font-mono bg-purple-900/40 px-1.5 py-0.5 rounded">
                        {term.symbol}
                      </span>
                    )}
                  </div>
                  <p className="text-purple-300 text-xs opacity-80 leading-relaxed">{term.short}</p>

                  {/* Detail (expanded) */}
                  <AnimatePresence>
                    {selected?.id === term.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-purple-500/20"
                      >
                        <p className="text-purple-100 text-xs leading-relaxed opacity-90">
                          {term.detail}
                        </p>
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}>
                          {GLOSSARY_CATEGORIES.find(c => c.id === term.category)?.emoji} {GLOSSARY_CATEGORIES.find(c => c.id === term.category)?.label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-purple-500 text-xs mt-1">
                  {selected?.id === term.id ? '▲' : '▼'}
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-white font-semibold">Không tìm thấy thuật ngữ</p>
          <p className="text-purple-300 text-sm opacity-60 mt-1">Thử từ khóa khác</p>
        </div>
      )}
    </div>
  );
}

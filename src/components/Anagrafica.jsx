import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Cpu, Radio, Plus, Search, 
  Edit, Trash2, ChevronRight, Save, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Anagrafica = ({ initialTab = 'clienti' }) => {
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState({ clienti: [], sedi: [], centrali: [], dispositivi: [] });
  const [selected, setSelected] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    cliente: { ragione_sociale: '', partita_iva: '', codice_fiscale: '', indirizzo: '', cap: '', città: '', provincia: '', telefono: '', email: '', pec: '', rappresentante_legale: '' },
    sede: { nome_sede: '', indirizzo: '', città: '', livello_rischio: 'medio', attività: '' },
    centrale: { marca: '', modello: '', numero_serie: '', anno_installazione: '', centrale_tipologia: 'indirizzata' },
    dispositivo: { dispositivo_tipo: 'rilevatore_fumo', indirizzo_centrale: '', zona: '', posizione: '', piano: '', marca: '', modello: '' }
  });

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const table = tab === 'clienti' ? 'clienti' : 
                   tab === 'sedi' ? 'sedi' :
                   tab === 'centrali' ? 'centrali' : 'dispositivi';
      const { data: result } = await supabase.from(table).select('*').limit(100);
      setData(prev => ({ ...prev, [tab]: result || [] }));
    } catch (err) {
      console.error('Errore:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const items = data[tab] || [];
    if (!searchTerm) return items;
    return items.filter(item => 
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSave = async () => {
    try {
      const table = tab === 'clienti' ? 'clienti' : 
                   tab === 'sedi' ? 'sedi' :
                   tab === 'centrali' ? 'centrali' : 'dispositivi';
      const formData = tab === 'clienti' ? form.cliente : 
                       tab === 'sedi' ? form.sede : 
                       tab === 'centrali' ? form.centrale : form.dispositivo;
      await supabase.from(table).insert([formData]);
      setIsEditing(false);
      loadData();
    } catch (err) {
      console.error('Errore save:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo elemento?')) return;
    try {
      const table = tab === 'clienti' ? 'clienti' : 
                   tab === 'sedi' ? 'sedi' :
                   tab === 'centrali' ? 'centrali' : 'dispositivi';
      await supabase.from(table).delete().eq('id', id);
      loadData();
    } catch (err) {
      console.error('Errore delete:', err);
    }
  };

  const getIcon = () => {
    const icons = { clienti: Building2, sedi: MapPin, centrali: Cpu, dispositivi: Radio };
    return icons[tab];
  };

  const tabs = [
    { id: 'clienti', label: 'Clienti', icon: Building2 },
    { id: 'sedi', label: 'Sedi', icon: MapPin },
    { id: 'centrali', label: 'Centrali', icon: Cpu },
    { id: 'dispositivi', label: 'Dispositivi', icon: Radio }
  ];

  const Tipologie = {
    centrale_tipologia: [
      { value: 'convenzionale', label: 'Convenzionale' },
      { value: 'indirizzata', label: 'Indirizzata' },
      { value: 'analogica', label: 'Analogica' },
      { value: 'mista', label: 'Mista' }
    ],
    dispositivo_tipo: [
      { value: 'rilevatore_fumo', label: 'Rilevatore Fumo' },
      { value: 'rilevatore_calore', label: 'Rilevatore Calore' },
      { value: 'rilevatore_fumo_calore', label: 'Rilevatore Fumo/Calore' },
      { value: 'rilevatore_lineare', label: 'Rilevatore Lineare' },
      { value: 'rilevatore_gas', label: 'Rilevatore Gas' },
      { value: 'pulsante_allarme', label: 'Pulsante Allarme' },
      { value: 'sirena', label: 'Sirena' },
      { value: 'lampeggiante', label: 'Lampeggiante' },
      { value: 'modulo_supervisione', label: 'Modulo Supervisione' },
      { value: 'elettromagnete', label: 'Elettromagnete' }
    ],
    livello_rischio: [
      { value: 'basso', label: 'Basso' },
      { value: 'medio', label: 'Medio' },
      { value: 'elevato', label: 'Elevato' },
      { value: 'molto elevato', label: 'Molto Elevato' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Anagrafica Impianti</h1>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nuovo
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="flex border-b overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {tab === 'clienti' && (
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Ragione Sociale</th>
                  )}
                  {tab === 'sedi' && (
                    <>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Nome Sede</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Cliente</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Rischio</th>
                    </>
                  )}
                  {tab === 'centrali' && (
                    <>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Marca/Modello</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Sede</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Tipo</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Anno</th>
                    </>
                  )}
                  {tab === 'dispositivi' && (
                    <>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Indirizzo</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Tipo</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Zona</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Stato</th>
                    </>
                  )}
                  <th className="text-right p-3 text-xs font-medium text-gray-500">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan="5" className="p-4 text-center">Caricamento...</td></tr>
                ) : getFilteredData().length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">Nessun dato</td></tr>
                ) : (
                  getFilteredData().map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {tab === 'clienti' && (
                        <>
                          <td className="p-3">{item.ragione_sociale}</td>
                          <td className="p-3 text-sm text-gray-500">{item.partita_iva}</td>
                        </>
                      )}
                      {tab === 'sedi' && (
                        <>
                          <td className="p-3 font-medium">{item.nome_sede}</td>
                          <td className="p-3 text-sm text-gray-500">{item.cliente_id}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded ${
                              item.livello_rischio === 'basso' ? 'bg-green-100 text-green-700' :
                              item.livello_rischio === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                              item.livello_rischio === 'elevato' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.livello_rischio}
                            </span>
                          </td>
                        </>
                      )}
                      {tab === 'centrali' && (
                        <>
                          <td className="p-3">{item.marca} {item.modello}</td>
                          <td className="p-3 text-sm text-gray-500">{item.sede_id}</td>
                          <td className="p-3 text-sm">{item.centrale_tipologia}</td>
                          <td className="p-3 text-sm">{item.anno_installazione}</td>
                        </>
                      )}
                      {tab === 'dispositivi' && (
                        <>
                          <td className="p-3 font-mono text-sm">[{item.indirizzo_centrale}]</td>
                          <td className="p-3 text-sm">{item.dispositivo_tipo?.replace('_', ' ')}</td>
                          <td className="p-3 text-sm">{item.zona}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded ${
                              item.stato === 'attivo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.stato}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="p-3 text-right">
                        <button
                          onClick={() => { setSelected(item); setIsEditing(true); }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {selected ? 'Modifica' : 'Nuovo'} {tab}
                </h2>
                <button onClick={() => { setIsEditing(false); setSelected(null); }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {tab === 'clienti' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ragione Sociale *</label>
                      <input
                        type="text"
                        value={form.cliente.ragione_sociale}
                        onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, ragione_sociale: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
                        <input
                          type="text"
                          value={form.cliente.partita_iva}
                          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, partita_iva: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                        <input
                          type="text"
                          value={form.cliente.telefono}
                          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, telefono: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                      <input
                        type="text"
                        value={form.cliente.indirizzo}
                        onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, indirizzo: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                        <input
                          type="text"
                          value={form.cliente.città}
                          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, città: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                        <input
                          type="text"
                          value={form.cliente.cap}
                          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, cap: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                        <input
                          type="text"
                          value={form.cliente.provincia}
                          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, provincia: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={form.cliente.email}
                          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, email: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PEC</label>
                        <input
                          type="email"
                          value={form.cliente.pec}
                          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, pec: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                        <input
                          type="text"
                          value={form.cliente.codice_fiscale}
                          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, codice_fiscale: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rappresentante Legale</label>
                        <input
                          type="text"
                          value={form.cliente.rappresentante_legale}
                          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, rappresentante_legale: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}

                {tab === 'sedi' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Sede *</label>
                      <input
                        type="text"
                        value={form.sede.nome_sede}
                        onChange={(e) => setForm({ ...form, sede: { ...form.sede, nome_sede: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                      <select className="w-full p-2 border rounded-lg">
                        <option value="">Seleziona cliente...</option>
                        {data.clienti.map(c => (
                          <option key={c.id} value={c.id}>{c.ragione_sociale}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                      <input
                        type="text"
                        value={form.sede.indirizzo}
                        onChange={(e) => setForm({ ...form, sede: { ...form.sede, indirizzo: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                        <input
                          type="text"
                          value={form.sede.città}
                          onChange={(e) => setForm({ ...form, sede: { ...form.sede, città: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Livello Rischio</label>
                        <select
                          value={form.sede.livello_rischio}
                          onChange={(e) => setForm({ ...form, sede: { ...form.sede, livello_rischio: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        >
                          {Tipologie.livello_rischio.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attività</label>
                      <input
                        type="text"
                        value={form.sede.attività}
                        onChange={(e) => setForm({ ...form, sede: { ...form.sede, attività: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}

                {tab === 'centrali' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                      <input
                        type="text"
                        value={form.centrale.marca}
                        onChange={(e) => setForm({ ...form, centrale: { ...form.centrale, marca: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Modello</label>
                      <input
                        type="text"
                        value={form.centrale.modello}
                        onChange={(e) => setForm({ ...form, centrale: { ...form.centrale, modello: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numero Serie</label>
                        <input
                          type="text"
                          value={form.centrale.numero_serie}
                          onChange={(e) => setForm({ ...form, centrale: { ...form.centrale, numero_serie: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Anno Installazione</label>
                        <input
                          type="number"
                          value={form.centrale.anno_installazione}
                          onChange={(e) => setForm({ ...form, centrale: { ...form.centrale, anno_installazione: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
                      <select className="w-full p-2 border rounded-lg">
                        <option value="">Seleziona sede...</option>
                        {data.sedi.map(s => (
                          <option key={s.id} value={s.id}>{s.nome_sede}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia</label>
                      <select
                        value={form.centrale.centrale_tipologia}
                        onChange={(e) => setForm({ ...form, centrale: { ...form.centrale, centrale_tipologia: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      >
                        {Tipologie.centrale_tipologia.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {tab === 'dispositivi' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia *</label>
                      <select
                        value={form.dispositivo.dispositivo_tipo}
                        onChange={(e) => setForm({ ...form, dispositivo: { ...form.dispositivo, dispositivo_tipo: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      >
                        {Tipologie.dispositivo_tipo.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo Centrale</label>
                        <input
                          type="text"
                          value={form.dispositivo.indirizzo_centrale}
                          onChange={(e) => setForm({ ...form, dispositivo: { ...form.dispositivo, indirizzo_centrale: e.target.value } })}
                          placeholder="es: 001"
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                        <input
                          type="text"
                          value={form.dispositivo.zona}
                          onChange={(e) => setForm({ ...form, dispositivo: { ...form.dispositivo, zona: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Posizione</label>
                      <input
                        type="text"
                        value={form.dispositivo.posizione}
                        onChange={(e) => setForm({ ...form, dispositivo: { ...form.dispositivo, posizione: e.target.value } })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Piano</label>
                        <input
                          type="text"
                          value={form.dispositivo.piano}
                          onChange={(e) => setForm({ ...form, dispositivo: { ...form.dispositivo, piano: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Centrale</label>
                        <select className="w-full p-2 border rounded-lg">
                          <option value="">Seleziona centrale...</option>
                          {data.centrali.map(c => (
                            <option key={c.id} value={c.id}>{c.marca} {c.modello}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                        <input
                          type="text"
                          value={form.dispositivo.marca}
                          onChange={(e) => setForm({ ...form, dispositivo: { ...form.dispositivo, marca: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modello</label>
                        <input
                          type="text"
                          value={form.dispositivo.modello}
                          onChange={(e) => setForm({ ...form, dispositivo: { ...form.dispositivo, modello: e.target.value } })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => { setIsEditing(false); setSelected(null); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  Salva
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Anagrafica;
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, FileText, Calendar, User, Search,
  Download, Plus, Filter, CheckCircle, XCircle, AlertTriangle,
  Clock, MapPin, Cpu, Wrench, Camera, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const InterventiVerbali = ({ initialTab = 'interventi' }) => {
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState({ interventi: [], verbali: [], nc: [] });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ stato: '', dataDa: '', dataA: '' });

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [interventiRes, verbaliRes, ncRes] = await Promise.all([
        supabase.from('piani_manutenzione').select('*').limit(100),
        supabase.from('verbali').select('*').limit(100),
        supabase.from('non_conformita').select('*').limit(100)
      ]);

      setData({
        interventi: interventiRes.data || [],
        verbali: verbaliRes.data || [],
        nc: ncRes.data || []
      });
    } catch (err) {
      console.error('Errore:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    let items = data[tab] || [];
    
    if (searchTerm) {
      items = items.filter(item => 
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filter.stato) {
      items = items.filter(item => item.stato === filter.stato);
    }
    
    return items;
  };

  const downloadVerbale = async (id) => {
    try {
      const res = await fetch(`/api/verbali/${id}/download`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verbale_${id}.pdf`;
      a.click();
    } catch (err) {
      console.error('Errore download:', err);
    }
  };

  const getStatoBadge = (stato) => {
    const stati = {
      pendente: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      in_corso: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Wrench },
      completato: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      aperta: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
      in_gestione: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Wrench },
      risolta: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      chiusa: { bg: 'bg-gray-100', text: 'text-gray-700', icon: CheckCircle }
    };
    const s = stati[stato] || stati.pendente;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${s.bg} ${s.text}`}>
        <s.icon className="w-3 h-3" />
        {stato}
      </span>
    );
  };

  const getGravitaBadge = (gravità) => {
    const colori = {
      bassa: 'text-green-600 bg-green-50 border-green-200',
      media: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      alta: 'text-orange-600 bg-orange-50 border-orange-200',
      critica: 'text-red-600 bg-red-50 border-red-200'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${colori[gravità] || colori.media}`}>
        {gravità}
      </span>
    );
  };

  const tabs = [
    { id: 'interventi', label: 'Interventi', icon: ClipboardList },
    { id: 'verbali', label: 'Verbali', icon: FileText },
    { id: 'nc', label: 'Non Conformità', icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Interventi e Verbali</h1>
          <button
            onClick={() => window.location.href = '/checklist'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nuovo Intervento
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
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {data[t.id]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="p-4 border-b flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            
            <select
              value={filter.stato}
              onChange={(e) => setFilter({ ...filter, stato: e.target.value })}
              className="p-2 border rounded-lg"
            >
              <option value="">Tutti gli stati</option>
              {tab === 'interventi' && (
                <>
                  <option value="pendente">Pendente</option>
                  <option value="in_corso">In Corso</option>
                  <option value="completato">Completato</option>
                </>
              )}
              {tab === 'nc' && (
                <>
                  <option value="aperta">Aperta</option>
                  <option value="in_gestione">In Gestione</option>
                  <option value="risolta">Risolta</option>
                  <option value="chiusa">Chiusa</option>
                </>
              )}
            </select>

            <input
              type="date"
              value={filter.dataDa}
              onChange={(e) => setFilter({ ...filter, dataDa: e.target.value })}
              className="p-2 border rounded-lg"
              placeholder="Da"
            />

            <input
              type="date"
              value={filter.dataA}
              onChange={(e) => setFilter({ ...filter, dataA: e.target.value })}
              className="p-2 border rounded-lg"
              placeholder="A"
            />
          </div>

          <div className="overflow-x-auto">
            {tab === 'interventi' && (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Data</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Sede</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Centrale</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Protocollo</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Tecnico</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Stato</th>
                    <th className="text-right p-3 text-xs font-medium text-gray-500">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan="7" className="p-4 text-center">Caricamento...</td></tr>
                  ) : getFilteredData().length === 0 ? (
                    <tr><td colSpan="7" className="p-4 text-center text-gray-500">Nessun intervento</td></tr>
                  ) : (
                    getFilteredData().map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 text-sm">
                          {item.data_intervento ? new Date(item.data_intervento).toLocaleDateString('it-IT') : '-'}
                        </td>
                        <td className="p-3 text-sm">{item.sede_id}</td>
                        <td className="p-3 text-sm">{item.centrale_id}</td>
                        <td className="p-3 text-sm">{item.protocollo_tipo}</td>
                        <td className="p-3 text-sm">{item.tecnico}</td>
                        <td className="p-3">{getStatoBadge(item.stato)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelected(item)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === 'verbali' && (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">N. Verbale</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Data</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Centrale</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Protocollo</th>
                    <th className="text-center p-3 text-xs font-medium text-gray-500">Conformità</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Tecnico</th>
                    <th className="text-right p-3 text-xs font-medium text-gray-500">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan="7" className="p-4 text-center">Caricamento...</td></tr>
                  ) : getFilteredData().length === 0 ? (
                    <tr><td colSpan="7" className="p-4 text-center text-gray-500">Nessun verbale</td></tr>
                  ) : (
                    getFilteredData().map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm font-medium">{item.numero_verbale}</td>
                        <td className="p-3 text-sm">
                          {item.data_verifica ? new Date(item.data_verifica).toLocaleDateString('it-IT') : '-'}
                        </td>
                        <td className="p-3 text-sm">{item.centrale_id}</td>
                        <td className="p-3 text-sm">{item.protocollo_tipo}</td>
                        <td className="p-3 text-center">
                          <span className={`font-bold ${
                            item.perc_conformità >= 80 ? 'text-green-600' :
                            item.perc_conformità >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {item.perc_conformità}%
                          </span>
                        </td>
                        <td className="p-3 text-sm">{item.tecnico_id}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => downloadVerbale(item.id)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelected(item)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === 'nc' && (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Data</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Dispositivo</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Tipo</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Gravità</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Descrizione</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Stato</th>
                    <th className="text-right p-3 text-xs font-medium text-gray-500">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan="7" className="p-4 text-center">Caricamento...</td></tr>
                  ) : getFilteredData().length === 0 ? (
                    <tr><td colSpan="7" className="p-4 text-center text-gray-500">Nessuna NC</td></tr>
                  ) : (
                    getFilteredData().map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 text-sm">
                          {item.data_apertura ? new Date(item.data_apertura).toLocaleDateString('it-IT') : '-'}
                        </td>
                        <td className="p-3 text-sm font-mono">[{item.dispositivo_id}]</td>
                        <td className="p-3 text-sm">{item.nc_tipo}</td>
                        <td className="p-3">{getGravitaBadge(item.gravità)}</td>
                        <td className="p-3 text-sm max-w-xs truncate">{item.descrizione}</td>
                        <td className="p-3">{getStatoBadge(item.stato)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelected(item)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {tab === 'interventi' && 'Dettaglio Intervento'}
                  {tab === 'verbali' && 'Dettaglio Verbale'}
                  {tab === 'nc' && 'Dettaglio Non Conformità'}
                </h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {tab === 'interventi' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Data Intervento</label>
                        <p className="font-medium">{selected.data_intervento}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Protocollo</label>
                        <p className="font-medium">{selected.protocollo_tipo}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Attività Svolta</label>
                      <p className="text-sm">{selected.attività_svolta}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Esito</label>
                      <p className="font-medium">{selected.esito_intervento}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Tecnico</label>
                      <p className="font-medium">{selected.tecnico}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Note</label>
                      <p className="text-sm">{selected.note}</p>
                    </div>
                  </>
                )}

                {tab === 'verbali' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Numero Verbale</label>
                        <p className="font-mono font-medium">{selected.numero_verbale}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Data Verifica</label>
                        <p className="font-medium">{selected.data_verifica}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Punti Totali</label>
                        <p className="font-medium">{selected.totali_punti}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Conformi</label>
                        <p className="font-medium text-green-600">{selected.punti_conformi}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">% Conformità</label>
                        <p className="font-bold">{selected.perc_conformità}%</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Firma Tecnico</label>
                      <p className="text-sm">{selected.firma_tecnico || 'Non firmato'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Note</label>
                      <p className="text-sm">{selected.note}</p>
                    </div>
                  </>
                )}

                {tab === 'nc' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Data Apertura</label>
                        <p className="font-medium">{selected.data_apertura}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Tipo NC</label>
                        <p className="font-medium">{selected.nc_tipo}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Gravità</label>
                      {getGravitaBadge(selected.gravità)}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Descrizione</label>
                      <p className="text-sm">{selected.descrizione}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Causa Probabile</label>
                      <p className="text-sm">{selected.causa_probabile}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Azione Correttiva</label>
                      <p className="text-sm">{selected.azione_correttiva}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Pezzi Ricambio</label>
                      <p className="text-sm">{selected.pezzi_ricambio}</p>
                    </div>
                    {selected.data_chiusura && (
                      <div>
                        <label className="block text-xs text-gray-500">Data Chiusura</label>
                        <p className="font-medium">{selected.data_chiusura}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="p-4 border-t flex justify-end gap-2">
                {tab === 'verbali' && selected.id && (
                  <button
                    onClick={() => downloadVerbale(selected.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Scarica PDF
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterventiVerbali;
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle, Clock, Flame, 
  Building2, Cpu, Wrench, TrendingUp,
  Calendar, Filter, Download, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dashboard = ({ onNavigate }) => {
  const [data, setData] = useState({
    scadenze: [],
    statistiche: { totaleCentrali: 0, scadenze30gg: 0, ncAperte: 0, conformitaMedia: 0 },
    copertura: [],
    attivitaRecenti: []
  });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('tutti');

  useEffect(() => {
    loadDashboard();
  }, [filtro]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [scadenzeRes, centraliRes, ncRes] = await Promise.all([
        supabase.from('scadenze_imminenti').select('*').limit(10),
        supabase.from('centrali').select('*', { count: 'exact' }),
        supabase.from('non_conformita').select('*', { count: 'exact' }).eq('stato', 'aperta')
      ]);

      const scadenze = scadenzeRes.data || [];
      const totaleCentrali = centraliRes.count || 0;
      const ncAperte = ncRes.count || 0;

      setData({ 
        scadenze, 
        statistiche: { 
          totaleCentrali, 
          scadenze30gg: scadenze.length, 
          ncAperte, 
          conformitaMedia: 0 
        }, 
        copertura: [], 
        attivitaRecenti: [] 
      });
    } catch (err) {
      console.error('Errore load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatoColore = (stato) => {
    const colori = {
      pendente: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      in_corso: 'text-blue-600 bg-blue-50 border-blue-200',
      completato: 'text-green-600 bg-green-50 border-green-200',
      'in ritardo': 'text-red-600 bg-red-50 border-red-200'
    };
    return colori[stato] || colori.pendente;
  };

  const getStatoIcon = (stato) => {
    if (stato === 'completato') return React.createElement(CheckCircle, { className: 'w-5 h-5 text-green-500' });
    if (stato === 'in ritardo' || stato === 'pendente') return React.createElement(Clock, { className: 'w-5 h-5 text-yellow-500' });
    return <Wrench className="w-5 h-5 text-blue-500" />;
  };

  const scadenzeFiltrate = data.scadenze.filter(s => 
    filtro === 'tutti' ? true :
    filtro === 'urgenti' ? s.giorni_rimanenti <= 7 :
    filtro === 'critiche' ? s.stato === 'Non conformità' :
    s.giorni_rimanenti <= 30
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Tecnica</h1>
            <p className="text-sm text-gray-500">Monitoraggio conformità UNI 11224</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Esporta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Centrali Attive</p>
                <p className="text-2xl font-bold text-gray-800">{data.statistiche.totaleCentrali}</p>
              </div>
              <Cpu className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Scadenze 30gg</p>
                <p className="text-2xl font-bold text-gray-800">{data.statistiche.scadenze30gg}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">NC Aperte</p>
                <p className="text-2xl font-bold text-gray-800">{data.statistiche.ncAperte}</p>
              </div>
              <Wrench className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Conformità Media</p>
                <p className="text-2xl font-bold text-gray-800">{data.statistiche.conformitaMedia}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scadenze Imminenti
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltro('tutti')}
                  className={`px-3 py-1 text-xs rounded ${filtro === 'tutti' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                >
                  Tutti
                </button>
                <button
                  onClick={() => setFiltro('urgenti')}
                  className={`px-3 py-1 text-xs rounded ${filtro === 'urgenti' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}
                >
                  Urgenti
                </button>
                <button
                  onClick={() => setFiltro('NC')}
                  className={`px-3 py-1 text-xs rounded ${filtro === 'NC' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}
                >
                  NC
                </button>
              </div>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Caricamento...</div>
              ) : scadenzeFiltrate.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nessuna scadenza trovata</div>
              ) : (
                scadenzeFiltrate.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onNavigate?.('interventi', item.centrale_id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{item.nome_sede}</p>
                        <p className="text-sm text-gray-500">
                          {item.marca} {item.modello} • {item.protocollo_tipo}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatoColore(item.stato)}`}>
                        {item.giorni_rimanenti <= 0 ? (
                          <span className="text-red-600">In ritardo</span>
                        ) : (
                          <span>{item.giorni_rimanenti} gg</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Copertura Ciclo Annuale
              </h2>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {data.copertura.map((item, idx) => (
                <div key={idx} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.marca} {item.modello}
                    </span>
                    <span className={`text-sm font-bold ${
                      item.percentuale_copertura >= 100 ? 'text-green-600' :
                      item.percentuale_copertura >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.percentuale_copertura}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.percentuale_copertura >= 100 ? 'bg-green-500' :
                        item.percentuale_copertura >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(item.percentuale_copertura, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.testati_anno_corrente} / {item.totale_punti_attivi} punti testati
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
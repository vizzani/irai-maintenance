import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, XCircle, AlertTriangle, Camera, 
  Save, Download, Wifi, WifiOff, ChevronDown, ChevronUp 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const ChecklistUNI11224 = ({ 
  pianoId, 
  centraleId, 
  protocolloTipo, 
  onSave, 
  onComplete,
  deviceList = [] 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [verifiche, setVerifiche] = useState({});

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const puntiNorma = {
    sorveglianza: [
      { codice: 'S-01', descrizione: 'Verifica visiva integrità impianto', tipologia: 'prova_funzionalità' },
      { codice: 'S-02', descrizione: 'Verifica assenza ostruttioni sensori', tipologia: 'prova_funzionalità' },
      { codice: 'S-03', descrizione: 'Controllo indicatori stato centrale', tipologia: 'prova_funzionalità' },
      { codice: 'S-04', descrizione: 'Verifica alimentazione primaria (230V)', tipologia: 'prova_efficacia' },
      { codice: 'S-05', descrizione: 'Verifica alimentazione accumulatori', tipologia: 'prova_efficacia' },
    ],
    controllo_periodico: [
      { codice: 'CP-01', descrizione: 'Prova funzionale di tutti i rilevatori', tipologia: 'prova_funzionalità' },
      { codice: 'CP-02', descrizione: 'Prova funzionale di tutti i pulsanti', tipologia: 'prova_funzionalità' },
      { codice: 'CP-03', descrizione: 'Prova allarme ottico/acustico', tipologia: 'prova_funzionalità' },
      { codice: 'CP-04', descrizione: 'Verifica segnalazione a centrale', tipologia: 'prova_funzionalità' },
      { codice: 'CP-05', descrizione: 'Prova trasmissione allarme UA', tipologia: 'prova_efficacia' },
      { codice: 'CP-06', descrizione: 'Controllo tarature sensori', tipologia: 'prova_efficacia' },
    ],
    presa_in_carico: [
      { codice: 'P1-01', descrizione: 'Acquisizione progetto esecutivo impianto IRAI (planimetrie, schema a blocchi, relazione tecnica)', norma: 'UNI 11224:2011 - p.5.2.1', tipologia: 'documentale' },
      { codice: 'P1-02', descrizione: 'Verifica Dichiarazione di Conformità (Di.Co.) D.M. 37/2008 con allegati tecnici', norma: 'D.M. 37/2008 - UNI 11224 p.5.2.2', tipologia: 'documentale' },
      { codice: 'P1-03', descrizione: 'Verifica certificazioni CE componenti (centrale, rivelatori, PAM, segnalatori) UNI EN 54', norma: 'UNI EN 54 - UNI 11224 p.5.2.3', tipologia: 'documentale' },
      { codice: 'P1-04', descrizione: 'Acquisizione manuale di uso e manutenzione centrale IRAI e componenti principali', norma: 'UNI 11224:2011 - p.5.2.4', tipologia: 'documentale' },
      { codice: 'P1-05', descrizione: 'Verifica registro dei controlli precedenti (log storico manutenzioni, guasti)', norma: 'UNI 11224:2011 - p.5.2.5', tipologia: 'documentale' },
      { codice: 'P1-06', descrizione: 'Acquisizione verbale di collaudo iniziale firmato dall\'installatore', norma: 'UNI 11224:2011 - p.5.2.6', tipologia: 'documentale' },
      { codice: 'P1-07', descrizione: 'Verifica corrispondenza numero e tipologia rivelatori installati vs progetto', norma: 'UNI 11224:2011 - p.5.3.1', tipologia: 'verifica' },
      { codice: 'P1-08', descrizione: 'Verifica posizionamento rivelatori: altezze, interdistanze, coperture UNI 9795', norma: 'UNI 9795 - UNI 11224 p.5.3.2', tipologia: 'verifica' },
      { codice: 'P1-09', descrizione: 'Verifica numero e posizionamento PAM rispetto al progetto', norma: 'UNI 11224:2011 - p.5.3.3', tipologia: 'verifica' },
      { codice: 'P1-10', descrizione: 'Verifica suddivisione in zone di rivelazione rispetto a planimetrie', norma: 'UNI 11224:2011 - p.5.3.4', tipologia: 'verifica' },
      { codice: 'P1-11', descrizione: 'Verifica centrale: modello, capacità linee, firmware, corrispondenza progetto', norma: 'UNI EN 54-2 - UNI 11224 p.5.3.5', tipologia: 'verifica' },
      { codice: 'P1-12', descrizione: 'Verifica cablaggio: tipo linea (singola/ad anello), sezione cavi, percorsi', norma: 'UNI 11224:2011 - p.5.3.6', tipologia: 'verifica' },
      { codice: 'P1-13', descrizione: 'Verifica interfacce: sgancio porte REI, spegnimento HVAC, attivazione EVAC', norma: 'UNI 11224:2011 - p.5.3.7', tipologia: 'verifica' },
      { codice: 'P1-14', descrizione: 'Test funzionale completo: simulazione allarme zona per zona, attuatori, temporizzazioni', norma: 'UNI 11224:2011 - p.5.4', tipologia: 'prova_funzionalità' },
      { codice: 'P1-15', descrizione: 'Compilazione verbale di presa in consegna con eventuali riserve e firma responsabile', norma: 'UNI 11224:2011 - p.6', tipologia: 'documentale' },
    ],
    revisione: [
      { codice: 'R-01', descrizione: 'Sostituzione accumulatori se >5 anni', tipologia: 'prova_complessiva' },
      { codice: 'R-02', descrizione: 'Pulizia sensori polvere', tipologia: 'prova_funzionalità' },
      { codice: 'R-03', descrizione: 'Verifica cablaggi e morsetti', tipologia: 'prova_funzionalità' },
      { codice: 'R-04', descrizione: 'Controllo funzionamento servizi ausiliari', tipologia: 'prova_efficacia' },
      { codice: 'R-05', descrizione: 'Aggiornamento software se disponibile', tipologia: 'prova_funzionalità' },
    ],
    verifica_generale: [
      { codice: 'VG-01', descrizione: 'Sostituzione componenti a fine vita', tipologia: 'prova_complessiva' },
      { codice: 'VG-02', descrizione: 'Revisione completa centrale', tipologia: 'prova_complessiva' },
      { codice: 'VG-03', descrizione: 'Prova carico batteria', tipologia: 'prova_efficacia' },
      { codice: 'VG-04', descrizione: 'Verifica sistema alimentazione', tipologia: 'prova_efficacia' },
      { codice: 'VG-05', descrizione: 'Collaudo funzionale impianto', tipologia: 'prova_complessiva' },
      { codice: 'VG-06', descrizione: 'Verifica integrazione altri sistemi', tipologia: 'prova_efficacia' },
      { codice: 'VG-07', descrizione: 'Rilascio dichiarazione conformità', tipologia: 'prova_complessiva' },
    ],
  };

  const getProtocolloLabel = (tipo) => {
    const labels = {
      sorveglianza: 'Sorveglianza (Semestrale) - UNI 11224',
      controllo_periodico: 'Controllo Periodico (Annuale) - UNI 11224',
      presa_in_carico: 'Presa in Carico P1 (Prima installazione) - UNI 11224',
      revisione: 'Revisione (ogni 5 anni) - UNI 11224',
      verifica_generale: 'Verifica Generale (12 anni) - UNI 11224',
    };
    return labels[tipo] || tipo;
  };

  const initVerifiche = useCallback(() => {
    const punti = puntiNorma[protocolloTipo] || [];
    
    if (deviceList.length === 0) {
      const initial = punti.map(punto => ({
        codice: punto.codice,
        descrizione: punto.descrizione,
        norma: punto.norma || '',
        tipologia: punto.tipologia,
        esito: null,
        note: '',
        foto: null,
      }));
      setVerifiche({ _items: initial });
    } else {
      const initial = {};
      deviceList.forEach(device => {
        initial[device.id] = punti.map(punto => ({
          puntoCodice: punto.codice,
          puntoDescrizione: punto.descrizione,
          tipologia: punto.tipologia,
          esito: null,
          valoreRilevato: '',
          note: '',
          oraInizio: null,
          oraFine: null,
          fotoPrima: null,
          fotoDopo: null,
        }));
      });
      setVerifiche(initial);
    }
  }, [protocolloTipo, deviceList]);

  useEffect(() => {
    initVerifiche();
  }, [initVerifiche]);

  const updateVerifica = (deviceId, puntoIndex, field, value) => {
    setVerifiche(prev => ({
      ...prev,
      [deviceId]: prev[deviceId].map((v, i) => 
        i === puntoIndex ? { ...v, [field]: value } : v
      )
    }));
  };

  const updateItemEsito = (idx, esito) => {
    setVerifiche(prev => ({
      ...prev,
      _items: prev._items.map((item, i) => i === idx ? { ...item, esito } : item)
    }));
  };

  const updateItemNote = (idx, note) => {
    setVerifiche(prev => ({
      ...prev,
      _items: prev._items.map((item, i) => i === idx ? { ...item, note } : item)
    }));
  };

  const handleItemPhoto = async (idx, event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setVerifiche(prev => ({
        ...prev,
        _items: prev._items.map((item, i) => i === idx ? { ...item, foto: e.target.result } : item)
      }));
    };
    reader.readAsDataURL(file);
  };

  const toggleDeviceExpand = (deviceId) => {
    setExpandedDevice(prev => prev === deviceId ? null : deviceId);
  };

  const handlePhotoCapture = async (deviceId, puntoIndex, tipoFoto) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      const foto = canvas.toDataURL('image/jpeg', 0.8);
      const field = tipoFoto === 'prima' ? 'fotoPrima' : 'fotoDopo';
      updateVerifica(deviceId, puntoIndex, field, foto);
    } catch (err) {
      console.error('Errore fotocamera:', err);
      alert('Fotocamera non disponibile. È possibile caricare una foto.');
    }
  };

  const saveVerifiche = async () => {
    setIsSaving(true);
    
    try {
      if (verifiche._items) {
        const itemsToSave = verifiche._items.map(item => ({
          piano_id: pianoId,
          centrale_id: centraleId,
          dispositivo_id: null,
          codice_verifica: item.codice,
          descrizione: item.descrizione,
          tipologia: item.tipologia,
          esito: item.esito === 'na' ? 'na' : item.esito === true ? 'ok' : item.esito === false ? 'anomalia' : null,
          note: item.note || null,
          foto_url: item.foto || null,
        }));
        
        const { error } = await supabase.from('verifiche_punto').insert(itemsToSave);
        if (error) throw error;
      } else {
        const payload = {
          pianoId,
          centraleId,
          protocolloTipo,
          verifiche,
          savedAt: new Date().toISOString(),
        };
        const { error } = await supabase.from('verifiche_punto').insert(payload);
        if (error) throw error;
      }
      
      setLastSync(new Date());
      alert('Checklist salvata con successo!');
      onComplete?.(verifiche);
    } catch (err) {
      console.error('Errore salvataggio:', err);
      localStorage.setItem(
        `pending_sync_${pianoId}_${Date.now()}`,
        JSON.stringify(verifiche)
      );
      alert('Salvato in locale. Sincronizzerai quando tornerai online.');
    } finally {
      setIsSaving(false);
    }
  };

  const generateReport = async () => {
    const reportData = {
      pianoId,
      centraleId,
      protocolloTipo,
      protocolloLabel: getProtocolloLabel(protocolloTipo),
      verifiche,
      dataVerifica: currentTime.toISOString(),
      isOnline,
    };
    
    if (isOnline) {
      alert('Report PDF in fase di sviluppo. Usa il pulsante Salva per memorizzare i dati.');
    } else {
      alert('Report non disponibile offline. Sincronizza quando sei online.');
    }
  };

  const getStatoIcon = (esito) => {
    if (esito === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (esito === false) return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const calculateProgress = () => {
    let total = 0, completati = 0;
    if (verifiche._items) {
      total = verifiche._items.length;
      completati = verifiche._items.filter(v => v.esito !== null).length;
    } else {
      Object.values(verifiche).forEach(deviceVerifiche => {
        deviceVerifiche.forEach(v => {
          total++;
          if (v.esito !== null) completati++;
        });
      });
    }
    return total > 0 ? Math.round((completati / total) * 100) : 0;
  };

  const progress = calculateProgress();

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Check-list {getProtocolloLabel(protocolloTipo)}
            </h2>
            <p className="text-sm text-gray-500">
              UNI 11224:2019/2021 - Centro ID: {centraleId}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {lastSync && (
              <span className="text-xs text-gray-500">
                Ultimo sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso</span>
            <span className="text-sm font-bold text-gray-800">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveVerifiche}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </button>
          
          {progress === 100 && (
            <button
              onClick={generateReport}
              disabled={!isOnline}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Genera PDF
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {verifiche._items && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 w-20">Codice</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Punto Norma</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 w-24">Tipo</th>
                    <th className="text-center p-3 text-xs font-medium text-gray-500 w-32">Esito</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiche._items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3 font-mono text-sm font-bold text-blue-600">{item.codice}</td>
                      <td className="p-3">
                        <div className="text-sm text-gray-800">{item.descrizione}</div>
                        {item.norma && <div className="text-xs text-gray-500 mt-1">{item.norma}</div>}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          item.tipologia === 'prova_funzionalità' ? 'bg-blue-100 text-blue-700' :
                          item.tipologia === 'prova_efficacia' ? 'bg-purple-100 text-purple-700' :
                          item.tipologia === 'documentale' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.tipologia.replace('prova_', '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateItemEsito(idx, true)}
                            className={`px-3 py-2 rounded font-medium ${
                              item.esito === true ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-green-200'
                            }`}
                          >
                            OK
                          </button>
                          <button
                            onClick={() => updateItemEsito(idx, false)}
                            className={`px-3 py-2 rounded font-medium ${
                              item.esito === false ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-red-200'
                            }`}
                          >
                            ANOMALIA
                          </button>
                          <button
                            onClick={() => updateItemEsito(idx, 'na')}
                            className={`px-3 py-2 rounded font-medium ${
                              item.esito === 'na' ? 'bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-400'
                            }`}
                          >
                            N/A
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        {item.esito === false && (
                          <div className="space-y-2">
                            <textarea
                              value={item.note || ''}
                              onChange={(e) => updateItemNote(idx, e.target.value)}
                              placeholder="Descrivi l'anomalia riscontrata..."
                              className="w-full p-2 text-sm border border-red-200 rounded-lg"
                              rows="2"
                            />
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                                <Camera className="w-4 h-4" />
                                Allega foto
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handleItemPhoto(idx, e)}
                                />
                              </label>
                              {item.foto && <span className="text-xs text-green-600">Foto allegata</span>}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!verifiche._items && deviceList.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Nessun dispositivo associato. Aggiungi dispositivi alla centrale.
          </div>
        )}

        {!verifiche._items && deviceList.length > 0 && (
          deviceList.map(device => (
            <div key={device.id} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleDeviceExpand(device.id)}
                className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-600">
                    [{device.indirizzo}]
                  </span>
                  <span className="font-medium text-gray-800">
                    {device.zona} - {device.posizione}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    device.stato === 'attivo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {device.stato}
                  </span>
                </div>
                {expandedDevice === device.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {expandedDevice === device.id && (
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 text-xs font-medium text-gray-500 w-20">Codice</th>
                        <th className="text-left p-2 text-xs font-medium text-gray-500">Punto Norma</th>
                        <th className="text-left p-2 text-xs font-medium text-gray-500 w-24">Tipo Prova</th>
                        <th className="text-center p-2 text-xs font-medium text-gray-500 w-24">Esito</th>
                        <th className="text-left p-2 text-xs font-medium text-gray-500 w-32">Valore</th>
                        <th className="text-center p-2 text-xs font-medium text-gray-500 w-20">Foto</th>
                        <th className="text-left p-2 text-xs font-medium text-gray-500">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(verifiche[device.id] || []).map((verifica, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 font-mono text-xs">{verifica.puntoCodice}</td>
                          <td className="p-2 text-sm">{verifica.puntoDescrizione}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              verifica.tipologia === 'prova_funzionalità' ? 'bg-blue-100 text-blue-700' :
                              verifica.tipologia === 'prova_efficacia' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {verifica.tipologia.replace('prova_', '')}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => updateVerifica(device.id, idx, 'esito', true)}
                                className={`p-1 rounded ${
                                  verifica.esito === true ? 'bg-green-500 text-white' : 'bg-gray-200'
                                }`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateVerifica(device.id, idx, 'esito', false)}
                                className={`p-1 rounded ${
                                  verifica.esito === false ? 'bg-red-500 text-white' : 'bg-gray-200'
                                }`}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={verifica.valoreRilevato}
                              onChange={(e) => updateVerifica(device.id, idx, 'valoreRilevato', e.target.value)}
                              placeholder="Valore rilevato"
                              className="w-full p-1 text-sm border rounded"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handlePhotoCapture(device.id, idx, 'prima')}
                                className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                                title="Foto prima"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePhotoCapture(device.id, idx, 'dopo')}
                                className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                                title="Foto dopo"
                              >
                                <Camera className="w-4 h-4 text-blue-600" />
                              </button>
                            </div>
                            {(verifica.fotoPrima || verifica.fotoDopo) && (
                              <span className="text-xs text-green-600">✓</span>
                            )}
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={verifica.note}
                              onChange={(e) => updateVerifica(device.id, idx, 'note', e.target.value)}
                              placeholder="Note..."
                              className="w-full p-1 text-sm border rounded"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChecklistUNI11224;
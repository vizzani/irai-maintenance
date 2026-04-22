import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, XCircle, AlertTriangle, Camera, 
  Save, Download, Wifi, WifiOff, ChevronDown, ChevronUp 
} from 'lucide-react';

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
      sorveglianza: 'Sorveglianza (Semestrale)',
      controllo_periodico: 'Controllo Periodico (Annuale)',
      revisione: 'Revisione (ogni 5 anni)',
      verifica_generale: 'Verifica Generale (12 anni)',
    };
    return labels[tipo] || tipo;
  };

  const initVerifiche = useCallback(() => {
    const punti = puntiNorma[protocolloTipo] || [];
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
    
    const payload = {
      pianoId,
      centraleId,
      protocolloTipo,
      verifiche,
      savedAt: new Date().toISOString(),
      isOnline,
    };

    try {
      if (isOnline) {
        const response = await fetch('/api/verifiche/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) throw new Error('Errore salvataggio');
      } else {
        localStorage.setItem(
          `pending_sync_${pianoId}_${Date.now()}`,
          JSON.stringify(payload)
        );
      }
      
      setLastSync(new Date());
      onSave?.(payload);
    } catch (err) {
      localStorage.setItem(
        `pending_sync_${pianoId}_${Date.now()}`,
        JSON.stringify(payload)
      );
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
      const response = await fetch('/api/verbali/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VERBALE_${protocolloTipo}_${centraleId}_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
      }
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
    Object.values(verifiche).forEach(deviceVerifiche => {
      deviceVerifiche.forEach(v => {
        total++;
        if (v.esito !== null) completati++;
      });
    });
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
        {deviceList.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Nessun dispositivo associato. Aggiungi dispositivi alla centrale.
          </div>
        ) : (
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
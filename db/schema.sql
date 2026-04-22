-- ============================================================
-- SCHEMA DATABASE IRAI - UNI 11224:2019/2021 CONFORME
-- Sistema Gestionale Manutenzione Impianti Antincendio
-- ============================================================

-- ============================================================
-- ANAGRAFICA CLIENTI
-- ============================================================
CREATE TABLE clienti (
    id SERIAL PRIMARY KEY,
    ragione_sociale VARCHAR(255) NOT NULL,
    partita_iva VARCHAR(11) UNIQUE,
    codice_fiscale VARCHAR(16),
    indirizzo VARCHAR(255),
    cap VARCHAR(5),
    città VARCHAR(100),
    provincia VARCHAR(2),
    telefono VARCHAR(50),
    email VARCHAR(100),
    pec VARCHAR(100),
    rappresentante_legale VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- ANAGRAFICA SEDI (Impianti)
-- ============================================================
CREATE TABLE sedi (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clienti(id) ON DELETE CASCADE,
    nome_sede VARCHAR(255) NOT NULL,
    indirizzo VARCHAR(255),
    cap VARCHAR(5),
    città VARCHAR(100),
    provincia VARCHAR(2),
    attività VARCHAR(255),
    attività_ateco VARCHAR(10),
    superficie_mq INTEGER,
    altezza_metri DECIMAL(5,2),
    livello_rischio VARCHAR(20) CHECK (livello_rischio IN ('basso', 'medio', 'elevato', 'molto elevato')),
    piano VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- CENTRALI ANTINCENDIO
-- ============================================================
CREATE TABLE centrali (
    id SERIAL PRIMARY KEY,
    sede_id INTEGER REFERENCES sedi(id) ON DELETE CASCADE,
    marca VARCHAR(100) NOT NULL,
    modello VARCHAR(100),
    numero_serie VARCHAR(100) UNIQUE,
    anno_installazione INTEGER,
    anno_revisione_generale INTEGER,
    protocollo_indirizzo VARCHAR(50),
    port TCP INTEGER DEFAULT 502,
    centrale_tipologia VARCHAR(50) CHECK (centrale_tipologia IN ('convenzionale', 'indirizzata', 'analogica', 'mista')),
    zona_centrale VARCHAR(100),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- DISPOSITIVI (Rilevatori, Pulsanti, Sirene, ecc.)
-- ============================================================
CREATE TABLE dispositivi (
    id SERIAL PRIMARY KEY,
    centrale_id INTEGER REFERENCES centrali(id) ON DELETE CASCADE,
    dispositivo_tipo VARCHAR(50) NOT NULL CHECK (
        dispositivo_tipo IN (
            'rilevatore_fumo', 'rilevatore_calore', 'rilevatore_fumo_calore',
            'rilevatore_lineare', 'rilevatore_gas', 'rilevatore_raggi_infrarossi',
            'pulsante_allarme', 'sirena', 'lampeggiante', 'modulo_supervisione',
            'elettromagnete', 'rilevatore_unico', 'porta_rete', 'unità_centrale'
        )
    ),
    indirizzo_centrale VARCHAR(20),
    zona VARCHAR(100),
    posizione VARCHAR(255),
    piano VARCHAR(50),
    ambiente VARCHAR(100),
    marca VARCHAR(100),
    modello VARCHAR(100),
    numero_serie VARCHAR(100) UNIQUE,
    data_installazione DATE,
    data_ultima_manutenzione DATE,
    data_scadenza_next DATE GENERATED ALWAYS AS (data_ultima_manutenzione + INTERVAL '1 year') STORED,
    stato VARCHAR(20) CHECK (stato IN ('attivo', 'disattivato', 'guasto', 'sostituito')),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- PIANO DI MANUTENZIONE (Cicli UNI 11224)
-- ============================================================
CREATE TABLE piani_manutenzione (
    id SERIAL PRIMARY KEY,
    centrale_id INTEGER REFERENCES centrali(id) ON DELETE CASCADE,
    protocollo_tipo VARCHAR(50) NOT NULL CHECK (
        protocollo_tipo IN ('sorveglianza', 'controllo_periodico', 'revisione', 'verifica_generale')
    ),
    frequenza_mesi INTEGER NOT NULL CHECK (
        frequenza_mesi IN (6, 12, 24, 60, 120)
    ),
    data_prevista DATE NOT NULL,
    data_effettiva DATE,
    tecnico_id INTEGER,
    stato VARCHAR(20) DEFAULT 'pendente' CHECK (stato IN ('pendente', 'in_corso', 'completato', 'annullato')),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- VERIFICHE SUI SINGOLI PUNTI (Tracciabilità UNI 11224)
-- ============================================================
CREATE TABLE verifiche_punto (
    id SERIAL PRIMARY KEY,
    piano_id INTEGER REFERENCES piani_manutenzione(id) ON DELETE CASCADE,
    dispositivo_id INTEGER REFERENCES dispositivi(id) ON DELETE SET NULL,
    punto_norma VARCHAR(50) NOT NULL,
    tipologia_prova VARCHAR(50) NOT NULL CHECK (
        tipologia_prova IN ('prova_funzionalità', 'prova_efficacia', 'prova_complessiva')
    ),
    esito BOOLEAN,
    valore_rilevato VARCHAR(50),
    soglia_conformità VARCHAR(50),
    foto_prima BYTEA,
    foto_dopo BYTEA,
    ora_inizio TIMESTAMP,
    ora_fine TIMESTAMP,
    tecnico VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================================
-- REGISTRO ANTINCENDIO (Obbligatorio DM 20/12/2018)
-- ============================================================
CREATE TABLE registro_antincendio (
    id SERIAL PRIMARY KEY,
    intervento_id INTEGER,
    sede_id INTEGER REFERENCES sedi(id) ON DELETE SET NULL,
    centrale_id INTEGER REFERENCES centrali(id) ON DELETE SET NULL,
    dispositivo_id INTEGER REFERENCES dispositivi(id) ON DELETE SET NULL,
    data_intervento DATE NOT NULL,
    ora_intervento TIME NOT NULL,
    attività_svolta TEXT NOT NULL,
    esito_intervento VARCHAR(20) CHECK (esito_intervento IN ('conformità', 'non_conformità', 'guasto', 'sostituzione')),
    tecnico VARCHAR(255) NOT NULL,
    firma_tecnico VARCHAR(255),
    data_verbale DATE,
    numero_verbale VARCHAR(50) UNIQUE,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================================
-- NON CONFORMITÀ
-- ============================================================
CREATE TABLE non_conformita (
    id SERIAL PRIMARY KEY,
    verifica_id INTEGER REFERENCES verifiche_punto(id) ON DELETE SET NULL,
    dispositivo_id INTEGER REFERENCES dispositivi(id) ON DELETE SET NULL,
    centrale_id INTEGER REFERENCES centrali(id) ON DELETE SET NULL,
    nc_tipo VARCHAR(50) NOT NULL CHECK (
        nc_tipo IN ('anomalia', 'guasto', 'difetto', 'mancanza_ricambio', 'ritardo_intervento')
    ),
    gravità VARCHAR(20) CHECK (gravità IN ('bassa', 'media', 'alta', 'critica')),
    descrizione TEXT NOT NULL,
    causa_probabile TEXT,
    azione_correttiva TEXT,
    pezzi_ricambio TEXT,
    stato VARCHAR(20) DEFAULT 'aperta' CHECK (stato IN ('aperta', 'in_gestione', 'risolta', 'chiusa')),
    data_apertura DATE DEFAULT CURRENT_DATE,
    data_chiusura DATE,
    foto_guasto BYTEA,
    costo DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================================
-- TECNICI
-- ============================================================
CREATE TABLE tecnici (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    codice_fiscale VARCHAR(16) UNIQUE,
    email VARCHAR(100),
    telefono VARCHAR(50),
    qualifica VARCHAR(100),
    certificationi TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================================
-- VERBALI DI MANUTENZIONE (PDF)
-- ============================================================
CREATE TABLE verbali (
    id SERIAL PRIMARY KEY,
    piano_id INTEGER REFERENCES piani_manutenzione(id) ON DELETE SET NULL,
    registro_id INTEGER REFERENCES registro_antincendio(id) ON DELETE SET NULL,
    tecnico_id INTEGER REFERENCES tecnici(id) ON DELETE SET NULL,
    centrale_id INTEGER REFERENCES centrali(id) ON DELETE SET NULL,
    numero_verbale VARCHAR(50) UNIQUE NOT NULL,
    data_verifica DATE NOT NULL,
    protocollo_tipo VARCHAR(50),
    totali_punti INTEGER,
    punti_conformi INTEGER,
    perc_conformità DECIMAL(5,2),
    pdf_path VARCHAR(500),
    firma_tecnico BYTEA,
    data_firma TIMESTAMP,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================================
-- SYNCHRONIZATION LOG FOR OFFLINE-FIRST PWA
-- ============================================================
CREATE TABLE sync_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    payload JSONB,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed'))
);

-- ============================================================
-- INDICI PER PERFORMANCE
-- ============================================================
CREATE INDEX idx_dispositivi_centrale ON dispositivi(centrale_id);
CREATE INDEX idx_dispositivi_stato ON dispositivi(stato);
CREATE INDEX idx_dispositivi_data_scadenza ON dispositivi(data_ultima_manutenzione);
CREATE INDEX idx_piani_centrale ON piani_manutenzione(centrale_id, data_prevista);
CREATE INDEX idx_piani_stato ON piani_manutenzione(stato);
CREATE INDEX idx_verifiche_piano ON verifiche_punto(piano_id, dispositivo_id);
CREATE INDEX idx_verifiche_tipo ON verifiche_punto(tipologia_prova);
CREATE INDEX idx_nc_stato ON non_conformita(stato, gravità);
CREATE INDEX idx_registro_data ON registro_antincendio(data_intervento);
CREATE INDEX idx_sync_status ON sync_log(sync_status, synced_at);

-- ============================================================
-- VIEW: COPERTURA CICLO ANNUALE (50% + 50%)
-- ============================================================
CREATE OR REPLACE VIEW copertura_ciclo AS
SELECT
    c.id AS centrale_id,
    c.marca,
    c.modello,
    COUNT(d.id) FILTER (WHERE d.stato = 'attivo') AS totale_punti_attivi,
    COUNT(vp.id) FILTER (
        WHERE vp.tipologia_prova = 'prova_funzionalità'
        AND vp.data_verifica >= DATE_TRUNC('year', CURRENT_DATE)
    ) AS testati_anno_corrente,
    ROUND(
        COUNT(vp.id) FILTER (
            WHERE vp.tipologia_prova = 'prova_funzionalità'
            AND vp.data_verifica >= DATE_TRUNC('year', CURRENT_DATE)
        )::DECIMAL / NULLIF(COUNT(d.id) FILTER (WHERE d.stato = 'attivo'), 0) * 100,
        2
    ) AS percentuale_copertura
FROM centrali c
LEFT JOIN dispositivi d ON d.centrale_id = c.id AND d.active = TRUE
LEFT JOIN verifiche_punto vp ON vp.centrale_id = c.id
GROUP BY c.id, c.marca, c.modello;

-- ============================================================
-- VIEW: SCADENZE IMMINENTI (Dashboard)
-- ============================================================
CREATE OR REPLACE VIEW scadenze_imminenti AS
SELECT
    s.id AS sede_id,
    s.nome_sede,
    c.id AS centrale_id,
    c.marca,
    c.modello,
    pm.protocollo_tipo,
    pm.data_prevista,
    pm.stato,
    EXTRACT(DAY FROM (pm.data_prevista - CURRENT_DATE)) AS giorni_rimanenti
FROM piani_manutenzione pm
JOIN centrali c ON c.id = pm.centrale_id
JOIN sedi s ON s.id = c.sede_id
WHERE pm.data_prevista <= CURRENT_DATE + INTERVAL '30 days'
    AND pm.stato IN ('pendente', 'in_corso')
ORDER BY pm.data_prevista;

-- ============================================================
-- FUNCTION: CALCOLO DATA VERIFICA GENERALE (12° ANNO)
-- ============================================================
CREATE OR REPLACE FUNCTION calcola_verifica_generale(p_centrale_id INTEGER)
RETURNS DATE AS $$
DECLARE
    v_data_install DATE;
    v_anno_install INTEGER;
    v_data_vg DATE;
BEGIN
    SELECT c.anno_installazione, c.anno_revisione_generale
    INTO v_anno_install, v_data_vg
    FROM centrali c
    WHERE c.id = p_centrale_id;

    IF v_data_vg IS NOT NULL THEN
        RETURN v_data_vg;
    END IF;

    IF v_anno_install IS NULL THEN
        RETURN NULL;
    END IF;

    v_data_vg := MAKE_DATE(v_anno_install + 12, 1, 1);
    RETURN v_data_vg;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: UPDATE UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clienti_updated
    BEFORE UPDATE ON clienti FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_sedi_updated
    BEFORE UPDATE ON sedi FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_centrali_updated
    BEFORE UPDATE ON centrali FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_dispositivi_updated
    BEFORE UPDATE ON dispositivi FOR EACH ROW EXECUTE FUNCTION update_updated_at();
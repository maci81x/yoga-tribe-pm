# YOGA TRIBE PROJECT MANAGER — Brief tecnico per Claude Code

## OBIETTIVO

Costruisci un'applicazione web completa di project management per Yoga Tribe APS.
L'app gestisce progetti, attivita con pipeline kanban, sotto-attivita (checklist), persone, e modelli riutilizzabili.
Deploy su GitHub Pages (repo: maci81x/yoga-tribe-pm). Persistenza su Supabase.

---

## STACK TECNICO

- React 18 + Vite
- Tailwind CSS 3
- @dnd-kit/core + @dnd-kit/sortable (drag-and-drop kanban + riordino subtask)
- @supabase/supabase-js (persistenza)
- react-router-dom v6 (routing: /, /project/:id, /people, /templates)
- lucide-react (icone)
- date-fns (formattazione date italiano)
- Deploy: GitHub Pages con vite.config base path

NON usare: TypeScript, Next.js, server-side rendering, autenticazione (per ora single-user).

---

## SUPABASE

Progetto esistente: wckouciivxovzuxboypl
Usa le variabili ambiente nel file .env.local:

```
VITE_SUPABASE_URL=https://wckouciivxovzuxboypl.supabase.co
VITE_SUPABASE_ANON_KEY=<chiedi a Roby o recupera da ~/.zshrc>
```

### Schema SQL — esegui queste migration:

```sql
-- Tabella progetti
CREATE TABLE IF NOT EXISTS yt_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '📌',
  color TEXT DEFAULT '#8B5CF6',
  archived BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella stati pipeline (globali, riutilizzabili)
CREATE TABLE IF NOT EXISTS yt_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#94a3b8',
  sort_order INTEGER DEFAULT 0,
  is_done_stage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella persone
CREATE TABLE IF NOT EXISTS yt_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  email TEXT DEFAULT '',
  avatar_color TEXT DEFAULT '#1A0033',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella attivita
CREATE TABLE IF NOT EXISTS yt_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES yt_projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES yt_stages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assignee_id UUID REFERENCES yt_people(id) ON DELETE SET NULL,
  due_date DATE,
  priority TEXT CHECK (priority IN ('alta', 'media', 'bassa')) DEFAULT 'media',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella sotto-attivita
CREATE TABLE IF NOT EXISTS yt_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES yt_tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella modelli (template)
CREATE TABLE IF NOT EXISTS yt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella task dei modelli
CREATE TABLE IF NOT EXISTS yt_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES yt_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT CHECK (priority IN ('alta', 'media', 'bassa')) DEFAULT 'media',
  sort_order INTEGER DEFAULT 0
);

-- Tabella subtask dei modelli
CREATE TABLE IF NOT EXISTS yt_template_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_task_id UUID REFERENCES yt_template_tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_tasks_project ON yt_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON yt_tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON yt_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON yt_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON yt_subtasks(task_id);

-- RLS: disabilita per ora (single-user, no auth)
ALTER TABLE yt_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_template_subtasks ENABLE ROW LEVEL SECURITY;

-- Policy permissiva (single user, no auth)
CREATE POLICY "allow_all" ON yt_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON yt_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON yt_people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON yt_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON yt_subtasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON yt_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON yt_template_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON yt_template_subtasks FOR ALL USING (true) WITH CHECK (true);
```

### Seed data — inserisci dopo la migration:

```sql
-- STAGES
INSERT INTO yt_stages (name, color, sort_order, is_done_stage) VALUES
  ('Da fare', '#94a3b8', 0, false),
  ('In corso', '#3b82f6', 1, false),
  ('In attesa', '#f59e0b', 2, false),
  ('Bloccato', '#ef4444', 3, false),
  ('Completato', '#22c55e', 4, true);

-- PEOPLE
INSERT INTO yt_people (name, role) VALUES
  ('Francesca Buffa', 'Fondatrice / Insegnante Senior'),
  ('Anna Zangara', 'Tutor Emozionale'),
  ('Matteo Caruso', 'Pedagogia / Teatro / BES-DSA'),
  ('Giulia Stella', 'Insegnante Vinyasa + Embodied'),
  ('Arianna', 'Operativo & Admin'),
  ('Marco', 'Advertising Specialist'),
  ('Roberto', 'Co-Founder / Strategist'),
  ('Giorgia Pellegrini', 'Educatrice'),
  ('Sabina Santoro', 'Educatrice');

-- PROJECTS
INSERT INTO yt_projects (name, description, emoji, color, sort_order) VALUES
  ('Yuppi Yoga', 'Doposcuola bambini 3-11 anni, metodo Balyayoga', '🧒', '#FF2D78', 0),
  ('Classi Ricorrenti', 'Kundalini, Vinyasa, Embodied, Meditazione', '🧘', '#8B5CF6', 1),
  ('Eventi', 'MAREE, SIRENE, Solstizi, Yoga Brunch, Vivi Tribe Day+', '🎪', '#F59E0B', 2),
  ('Collaborazioni', 'Borgo Scopeto, GSK Corporate, Partnership', '🤝', '#06B6D4', 3),
  ('Academy Online', 'Piattaforma lezioni digitali', '💻', '#10B981', 4),
  ('A Corpo Libero', 'Ebook + funnel lead magnet', '📖', '#EC4899', 5);

-- TEMPLATES
INSERT INTO yt_templates (name, description) VALUES
  ('Nuovo Plesso Scuola', 'Checklist per attivare Yuppi Yoga in una nuova scuola'),
  ('Nuovo Evento', 'Checklist per organizzare un evento Yoga Tribe'),
  ('Nuova Collaborazione', 'Iter per attivare una partnership B2B o luxury');

-- Per i template_tasks, usa gli ID generati dei template sopra.
-- Template "Nuovo Plesso Scuola":
-- 1. Primo contatto con dirigente scolastico (alta)
-- 2. Invio progetto educativo (alta)
-- 3. Incontro conoscitivo con la scuola (alta)
-- 4. Definire accordo commerciale (alta)
-- 5. Trovare educatrice per il plesso (alta)
-- 6. Training educatrice sul format (media)
-- 7. Definire orari e calendario (media)
-- 8. Comunicazione alle famiglie (media)
-- 9. Raccolta iscrizioni (media)
-- 10. Avvio attivita (bassa)

-- Template "Nuovo Evento":
-- 1. Definire concept e data (alta)
-- 2. Trovare e confermare location (alta)
-- 3. Budget previsionale (alta)
-- 4. Contattare sponsor / partner (media)
-- 5. Grafica e comunicazione social (media)
-- 6. Apertura iscrizioni / biglietteria (media)
-- 7. Logistica (attrezzatura, catering, musica) (media)
-- 8. Briefing team il giorno prima (bassa)
-- 9. Post-evento: foto, ringraziamenti, report (bassa)

-- Template "Nuova Collaborazione":
-- 1. Ricerca e primo contatto (alta)
-- 2. Invio proposta di collaborazione (alta)
-- 3. Incontro esplorativo (alta)
-- 4. Definire termini commerciali (media)
-- 5. Contratto / lettera d'intenti (media)
-- 6. Pianificare prima sessione pilota (media)
-- 7. Feedback e iterazione (bassa)
```

NOTA: per i seed dei template_tasks, recupera prima gli UUID dei template inseriti e usali come template_id. Fai la stessa cosa per le task con project_id, stage_id, assignee_id.

---

## DESIGN SYSTEM

### Palette
```
--primary:       #1A0033  (viola deep — header, avatar, accenti scuri)
--accent:        #FF2D78  (fucsia — CTA, progress bar, notifiche)
--accent-hover:  #e0255f
--bg:            #fafafa  (sfondo generale)
--card:          #ffffff
--border:        #f1f1f1
--text-primary:  #111827
--text-secondary:#6b7280
--text-muted:    #9ca3af

Priorita:
--priority-alta:  #ef4444
--priority-media: #f59e0b
--priority-bassa: #94a3b8
```

### Tipografia
- Font: Inter (Google Fonts) — gia disponibile in Tailwind
- Titoli: font-semibold o font-bold
- Body: text-sm (14px)
- Caption: text-xs (12px)
- Micro: text-[10px]

### Componenti UI
- Border radius: rounded-lg (8px) per card, rounded-xl (12px) per container
- Ombre: shadow-sm default, shadow-md su hover
- Badge: sfondo color+20% opacita, testo colore pieno
- Avatar: cerchio con iniziali, sfondo --primary, testo bianco
- Bottoni: primario (bg-primary), accent (bg-accent), ghost (text-gray hover:bg-gray-100)

### Responsive
- Mobile-first
- Dashboard: 1 colonna mobile, 2 colonne tablet, 3 colonne desktop
- Kanban: scroll orizzontale su mobile, colonne da 280px

---

## STRUTTURA PAGINE E COMPONENTI

### Routing (react-router-dom)
```
/                   → Dashboard (tutti i progetti + stats + scadenze)
/project/:id        → Vista progetto (kanban + lista)
/people             → Gestione persone
/templates          → Gestione modelli
```

### Layout
```
┌─────────────────────────────────────────────┐
│  HEADER (fisso, bg primary, logo + nav)     │
│  Logo "Yoga Tribe" sx — Nav dx              │
│  Nav: Progetti | Persone | Modelli          │
│  + Barra ricerca globale                    │
├─────────────────────────────────────────────┤
│  MAIN CONTENT (scrollabile)                 │
│                                             │
│  Contenuto pagina specifica                 │
│                                             │
└─────────────────────────────────────────────┘
```

### 1. DASHBOARD ( / )

**Sezione A — Stats globali (4 card in riga)**
- Totale attivita (conteggio)
- Completate (conteggio + % del totale)
- In ritardo (conteggio, rosso se > 0)
- Bloccate (conteggio, giallo se > 0)

**Sezione B — Griglia progetti**
Ogni ProjectCard mostra:
- Emoji + nome + descrizione (troncata)
- Barra progresso combinata (attivita completate + subtask spuntati / totale)
- Contatori: X aperte, Y in ritardo, Z bloccate
- Mini-barra distribuzione stati (segmenti colorati proporzionali)
- Click → naviga a /project/:id

**Sezione C — Prossime scadenze (7 giorni)**
Lista compatta:
- Icona alert se in ritardo
- Titolo attivita
- Badge progetto (colore progetto)
- Nome assegnato
- Data scadenza (rossa se passata, ambra se entro 3 giorni)
- Click → apre il task nel progetto

**Sezione D — Attivita per persona**
Tabella compatta: ogni persona con conteggio attivita aperte, in ritardo, bloccate.

### 2. VISTA PROGETTO ( /project/:id )

**Header progetto:**
- Breadcrumb: Progetti > [Nome progetto]
- Titolo con emoji
- Bottoni: + Nuova attivita | Da modello | Gestisci stati | Modifica progetto
- Toggle vista: Kanban / Lista
- Filtri: persona, priorita, stato (combinabili)
- Progress bar complessiva del progetto

**Vista Kanban:**
- Colonne per ogni stato, ordinate per sort_order
- Card draggabili tra colonne (@dnd-kit)
- Ogni card mostra:
  - Titolo
  - Badge priorita (alta/media/bassa)
  - Avatar + nome assegnatario
  - Scadenza con indicatore colore
  - Barra progresso subtask (se presenti)
  - Checklist subtask inline espandibile (spuntabili direttamente dalla card)
  - Bottoni quick-move verso altri stati
- Click sulla card → modale dettaglio/modifica

**Vista Lista:**
- Tabella ordinabile per: titolo, priorita, scadenza, assegnatario, stato
- Colonne: checkbox completamento | Titolo | Progresso subtask | Assegnatario | Scadenza | Priorita | Stato
- Espandi riga → vedi subtask inline
- Azioni inline: cambia stato, cambia assegnatario

**Modale Task (crea/modifica):**
- Titolo (input)
- Descrizione (textarea)
- Stato (select dagli stage)
- Priorita (select: alta/media/bassa)
- Assegnatario (select dalle persone)
- Scadenza (date picker)
- Sezione sotto-attivita:
  - Lista con checkbox + testo + bottone elimina
  - Input "Aggiungi sotto-attivita" con invio rapido
  - Drag-reorder con @dnd-kit
  - Barra progresso
- Bottoni: Salva | Elimina (con conferma)

### 3. PERSONE ( /people )

- Griglia card persone
- Ogni card: avatar (iniziali), nome, ruolo, conteggio attivita aperte
- Click → modale modifica (nome, ruolo, email)
- Bottone + per aggiungere
- Possibilita di disattivare (non eliminare se ha task assegnati)

### 4. MODELLI ( /templates )

- Griglia card modelli
- Ogni card: nome, descrizione, conteggio task precaricati, preview primi 4 task
- Click → modale modifica
- Modale modifica template:
  - Nome + descrizione
  - Lista task (titolo + priorita + subtask)
  - Aggiungi/rimuovi task
  - Per ogni task: aggiungi subtask predefinite
  - Drag-reorder task
- Bottone "Crea modello da progetto esistente" → seleziona un progetto, copia le task come template

**Applicazione template a progetto:**
- Quando applichi un template a un progetto, puoi scegliere:
  - Data di partenza (default: oggi)
  - Distanza giorni tra task (default: 3)
  - Assegnare tutte le task a una persona (opzionale)
- Le task vengono create nello stato "Da fare" con date scaglionate automaticamente

---

## FUNZIONALITA CHIAVE

### Drag and Drop
- @dnd-kit/core + @dnd-kit/sortable
- Task trascinabili tra colonne kanban
- Subtask riordinabili dentro il modale
- Salvataggio automatico su Supabase dopo ogni drop

### Ricerca globale
- Input nella header
- Cerca in: titoli task, descrizioni, nomi persone, nomi progetti
- Risultati raggruppati per progetto
- Click → naviga al task nel progetto

### Filtri combinabili (vista progetto)
- Per persona assegnata
- Per priorita
- Per stato
- Per scadenza (in ritardo / prossimi 7gg / prossimi 30gg / senza scadenza)
- I filtri si combinano in AND

### Auto-save
- Ogni modifica salva automaticamente su Supabase
- Indicatore di stato salvataggio nella header (pallino verde = salvato, giallo = salvataggio in corso)

### Statistiche progetto
Barra progresso che calcola:
- Peso attivita completata (stageId = stage con is_done_stage = true): vale 1
- Peso subtask completato: vale 1
- Totale = (task completate + subtask done) / (totale task + totale subtask) * 100

---

## STRUTTURA FILE

```
yoga-tribe-pm/
├── index.html
├── vite.config.js          (base: '/yoga-tribe-pm/')
├── package.json
├── .env.local              (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
├── .gitignore
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx             (router setup)
│   ├── lib/
│   │   └── supabase.js     (client init)
│   ├── hooks/
│   │   ├── useProjects.js
│   │   ├── useTasks.js
│   │   ├── useStages.js
│   │   ├── usePeople.js
│   │   └── useTemplates.js
│   ├── components/
│   │   ├── Layout.jsx          (header + nav + search)
│   │   ├── Dashboard.jsx
│   │   ├── ProjectView.jsx
│   │   ├── KanbanBoard.jsx
│   │   ├── KanbanColumn.jsx
│   │   ├── TaskCard.jsx
│   │   ├── TaskListView.jsx
│   │   ├── TaskModal.jsx
│   │   ├── SubtaskList.jsx
│   │   ├── PeoplePage.jsx
│   │   ├── PersonCard.jsx
│   │   ├── TemplatesPage.jsx
│   │   ├── TemplateModal.jsx
│   │   ├── ApplyTemplateModal.jsx
│   │   ├── StageManager.jsx
│   │   ├── ProjectCard.jsx
│   │   ├── SearchResults.jsx
│   │   ├── FilterBar.jsx
│   │   └── ui/
│   │       ├── Modal.jsx
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Select.jsx
│   │       ├── Badge.jsx
│   │       ├── ProgressBar.jsx
│   │       └── Avatar.jsx
│   └── styles/
│       └── index.css       (tailwind directives + custom vars)
```

---

## DEPLOY

```bash
# Build
npm run build

# Il dist/ va su GitHub Pages
# vite.config.js:
export default {
  base: '/yoga-tribe-pm/',
  // ...
}

# Deploy manuale:
cd dist
git init
git add .
git commit -m "deploy"
git push -f git@github.com:maci81x/yoga-tribe-pm.git main:gh-pages
```

Oppure usa gh-pages npm package per automatizzare.

---

## VINCOLI E NOTE

1. Lingua interfaccia: italiano. Tutti i label, placeholder, messaggi in italiano.
2. Nessun emoji nei bottoni o label UI. Emoji solo per le icone progetto.
3. Nessun asterisco nel testo UI.
4. Accenti corretti: attivita (con accentata non supportata nei nomi funzione JS, ma nei testi UI si).
5. Mobile-first: l'app deve essere usabile su iPhone. Il kanban scrolla orizzontalmente.
6. Performance: lazy loading delle task per progetto (non caricare tutte le task di tutti i progetti in dashboard).
7. La dashboard carica solo i conteggi aggregati, non le task singole.
8. Gestione errori: se Supabase non risponde, mostra messaggio "Connessione persa, riprovo..." e retry automatico.
9. Nessuna autenticazione per v1. Single user.
10. Il repo NON deve contenere .env.local (aggiungilo a .gitignore).

---

## ESEMPIO FLUSSO UTENTE

1. Roberto apre l'app → vede dashboard con 6 progetti, stats globali, scadenze prossime
2. Clicca su "Yuppi Yoga" → vede kanban con 5 task distribuite tra "Da fare" e "In corso"
3. Apre la card "Trovare 2 educatrici" → vede 4 subtask, ne spunta 1 → la barra avanza al 25%
4. Trascina la card da "Da fare" a "In corso" → si salva automaticamente
5. Clicca "Da modello" → sceglie "Nuovo Plesso Scuola" → 10 task appaiono in "Da fare" con date scaglionate
6. Torna alla dashboard → la barra di Yuppi Yoga mostra il nuovo avanzamento

---

## COME INIZIARE

```bash
cd ~/Sites
mkdir yoga-tribe-pm && cd yoga-tribe-pm
npm create vite@latest . -- --template react
npm install tailwindcss @tailwindcss/vite @supabase/supabase-js @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-router-dom lucide-react date-fns
```

Poi crea lo schema Supabase, inserisci i seed, e parti con i componenti nell'ordine:
1. lib/supabase.js + hooks
2. ui/ components
3. Layout + routing
4. Dashboard
5. ProjectView + Kanban
6. TaskModal con subtask
7. People + Templates
8. Search + Filtri
9. Deploy

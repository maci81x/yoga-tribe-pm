export default function GuidePage() {
  const sections = [
    {
      title: 'Dashboard',
      body: 'La pagina principale mostra tutti i progetti con le statistiche: attività totali, completate, in ritardo e bloccate. Clicca su un progetto per entrare. La sezione "Attività per persona" mostra il carico di lavoro di tutto il team.',
    },
    {
      title: 'Progetti',
      body: 'Ogni progetto ha una pipeline kanban con colonne personalizzabili. Puoi creare attività con il bottone "+ Nuova attività", trascinare le card tra le colonne per cambiare stato, filtrare per persona, priorità, stato o tag, e alternare tra vista Kanban e vista Lista.',
    },
    {
      title: 'Attività e sotto-attività',
      body: 'Ogni attività può avere sotto-attività (checklist). Le sotto-attività si spuntano direttamente dalla card senza aprire il dettaglio. La barra di avanzamento mostra il progresso combinato di attività e sotto-attività.',
    },
    {
      title: 'Tag / Sotto-eventi',
      body: 'Usa i tag per raggruppare attività all\'interno di un progetto. Nel progetto "Eventi" puoi usare tag come "Vivi Tribe Day+" per raggruppare tutte le attività di quell\'evento. I tag sono utili anche per Yuppi Yoga: un tag per ogni scuola (es. "IC Monteriggioni", "Primaria Poggibonsi").',
    },
    {
      title: 'Modelli (Template)',
      body: 'I modelli sono checklist predefinite per attività ricorrenti. Quando entri in un progetto, clicca "Da modello" per precaricare le attività. Puoi scegliere la data di partenza, la distanza in giorni tra le task e assegnare tutto a una persona.',
    },
    {
      title: 'Persone',
      body: 'Gestisci il team dalla sezione Persone. Puoi aggiungere nuove persone anche direttamente dal form di creazione attività senza uscire dal contesto. Clicca su una persona per vedere tutte le sue attività raggruppate per progetto.',
    },
    {
      title: 'Consigli',
      items: [
        'Usa priorità "alta" solo per le cose veramente urgenti',
        'Sposta le attività in "Bloccato" quando dipendono da qualcun altro',
        'Controlla la dashboard ogni lunedì per avere il quadro generale',
        'Usa i modelli per non dimenticare nessun passaggio',
        'I tag sono il modo più rapido per filtrare attività di uno stesso sotto-progetto',
      ],
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-2">Come usare Yoga Tribe PM</h1>
        <p className="text-dim text-sm">Guida rapida per gestire progetti, attività e il team Yoga Tribe.</p>
      </div>

      <div className="space-y-6">
        {sections.map(s => (
          <div key={s.title} className="bg-card rounded-xl border border-edge p-6">
            <h2 className="font-semibold text-primary text-base mb-2">{s.title}</h2>
            {s.body && <p className="text-sm text-dim leading-relaxed">{s.body}</p>}
            {s.items && (
              <ul className="space-y-1.5 mt-1">
                {s.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dim">
                    <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

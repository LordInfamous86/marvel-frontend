import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_ENDPOINT = API_BASE + '/api/marvel/characters'

function ImageOrPlaceholder({ character, large = false }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = character.imageUrl

  return (
    <div className={large
      ? 'relative min-h-56 overflow-hidden bg-[#211c1b] sm:min-h-[350px]'
      : 'relative min-h-[210px] overflow-hidden bg-[#211c1b]'}>
      {imageUrl && !failed ? (
        <img
          className="absolute inset-0 h-full min-h-[inherit] w-full object-cover object-top"
          src={imageUrl}
          alt={character.name}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid h-full min-h-[inherit] place-items-center bg-[radial-gradient(circle_at_50%_35%,#71312c,#2b1c1b_58%,#171615)]">
          <span className="text-5xl font-extrabold tracking-[-.08em] text-[#f3b4a9]/80">
            {character.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
          </span>
        </div>
      )}
      {!large && (
        <span className="absolute bottom-2.5 left-2.5 bg-black/75 px-2 py-1 font-mono text-[9px] text-white">
          #{character.id}
        </span>
      )}
    </div>
  )
}

function CharacterCard({ character, onSelect }) {
  return (
    <article className="grid min-h-[210px] grid-cols-[118px_1fr] overflow-hidden border border-line bg-gradient-to-br from-panel to-[#151514] transition hover:-translate-y-0.5 hover:border-[#6c3531] sm:grid-cols-[154px_1fr]">
      <ImageOrPlaceholder character={character} />
      <div className="flex min-w-0 flex-col items-start p-3 sm:p-[18px_17px_15px]">
        <p className="mb-2 font-mono text-[8px] font-bold tracking-[.1em] text-marvel">MARVEL CHARACTER</p>
        <h2 className="text-base font-bold tracking-[-.025em] sm:text-lg">{character.name}</h2>
        <p className="my-2.5 line-clamp-3 text-[11px] leading-relaxed text-muted">
          {character.description || 'No character description is available yet.'}
        </p>
        <div className="mt-auto flex w-full items-center justify-between gap-2 border-t border-line pt-2.5">
          <span className="text-[10px] text-paper/90">{character.comicsAvailable ?? 0} comics</span>
          <button
            className="shrink-0 font-mono text-[8px] font-bold tracking-[.1em] text-marvel hover:text-[#ff756b]"
            type="button"
            onClick={() => onSelect(character)}
          >
            VIEW PROFILE <span className="ml-1 text-sm">↗</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function CharacterDetail({ character, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const shown = detail || character

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setDetail(null)

    fetch(API_ENDPOINT + '/' + character.id, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Character details could not be loaded.')
        return response.json()
      })
      .then(setDetail)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError('Could not load this character from the backend.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [character.id])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="relative w-full max-w-3xl border border-[#51403d] bg-panel shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        <button
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center border border-white/30 bg-black/75 text-2xl hover:bg-marvel"
          type="button"
          onClick={onClose}
          aria-label="Close character details"
        >
          ×
        </button>
        <div className="grid sm:grid-cols-[.85fr_1.15fr]">
          <ImageOrPlaceholder character={shown} large />
          <div className="flex min-h-[260px] flex-col items-start p-6 sm:min-h-[350px] sm:p-9">
            <p className="mb-3 font-mono text-[9px] font-bold tracking-[.12em] text-marvel">
              CHARACTER PROFILE / #{shown.id}
            </p>
            <h2 id="detail-title" className="mb-4 pr-8 text-3xl font-extrabold leading-tight tracking-[-.04em]">
              {shown.name}
            </h2>
            {loading && <p className="text-sm text-muted">Loading profile...</p>}
            {error && <p className="text-sm text-marvel">{error}</p>}
            {!loading && !error && (
              <>
                <p className="mb-6 text-sm leading-relaxed text-muted">
                  {shown.description || 'No character description is available yet.'}
                </p>
                <div className="mt-auto flex w-full items-center justify-between border-y border-line py-4">
                  <span className="font-mono text-[9px] tracking-[.1em] text-muted">COMIC APPEARANCES</span>
                  <strong className="text-xl text-marvel">{shown.comicsAvailable ?? 0}</strong>
                </div>
                <p className="mt-4 font-mono text-[9px] tracking-[.1em] text-muted">
                  DATABASE ID <strong className="ml-2 text-paper">{shown.id}</strong>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [characters, setCharacters] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const url = new URL(API_ENDPOINT)
    if (searchTerm) url.searchParams.set('nameStartsWith', searchTerm)

    setLoading(true)
    setError('')

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('The character service returned an error.')
        return response.json()
      })
      .then((data) => setCharacters(data.results || []))
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError('Could not reach the character API. Make sure the backend is running in its terminal.')
          setCharacters([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [searchTerm])

  function handleSearch(event) {
    event.preventDefault()
    setSearchTerm(searchInput.trim())
  }

  function clearSearch() {
    setSearchInput('')
    setSearchTerm('')
  }

  return (
    <main className="mx-auto w-[calc(100%-28px)] max-w-[1180px] sm:w-[calc(100%-64px)]">
      <header className="flex h-[68px] items-center justify-between border-b border-line sm:h-[82px]">
        <a className="inline-flex items-center gap-3 text-paper no-underline" href="/" aria-label="Marvel Character Archive home">
          <span className="grid size-[34px] skew-x-[-7deg] place-items-center bg-marvel text-[23px] font-black italic leading-none text-white">M</span>
          <span className="text-xs font-black tracking-[.12em]">HERO<span className="text-marvel">ARCHIVE</span></span>
        </a>
        <div className="font-mono text-right text-[8px] tracking-[.1em] text-muted sm:text-[10px]">
          <span className="mr-2 inline-block size-[7px] rounded-full bg-[#79c58b] shadow-[0_0_10px_#79c58b88]" />
          LOCAL DATABASE
        </div>
      </header>

      <section className="grid min-h-0 grid-cols-1 items-center gap-0 overflow-hidden border-b border-line md:min-h-[394px] md:grid-cols-[1fr_390px] md:gap-[50px]">
        <div className="py-12 md:py-[55px]">
          <p className="mb-3.5 font-mono text-[10px] font-bold tracking-[.1em] text-marvel">A FULLSTACK DATABASE PROJECT</p>
          <h1 className="text-[clamp(52px,7vw,82px)] font-extrabold leading-[.98] tracking-[-.065em]">
            Every hero has<br /><em className="font-serif font-normal tracking-[-.045em] text-marvel">a story.</em>
          </h1>
          <p className="my-6 max-w-md text-[15px] leading-7 text-muted">
            Explore the characters behind the Marvel universe. Search the collection and discover their stories.
          </p>
          <div className="flex items-center gap-4 font-mono text-[9px] tracking-[.1em] text-muted">
            <span>COLLECTION<strong className="mt-1.5 block text-xs text-paper">{characters.length.toString().padStart(2, '0')}</strong></span>
            <span className="h-7 w-px bg-line" />
            <span>POWERED BY<strong className="mt-1.5 block text-xs text-paper">YOUR API</strong></span>
          </div>
        </div>
        <div className="relative hidden h-[330px] place-items-center md:grid" aria-hidden="true">
          <div className="absolute h-[125px] w-[310px] rotate-[-29deg] rounded-[50%] border border-white/5" />
          <div className="absolute h-[172px] w-[366px] rotate-[31deg] rounded-[50%] border border-white/5" />
          <div className="relative grid size-[215px] place-items-center rounded-full border border-marvel/40 bg-[radial-gradient(circle_at_50%_42%,#3b1c1b_0,#1b1717_49%,#141414_73%)] shadow-[0_0_90px_#d3272024,inset_0_0_45px_#e43a2e19]">
            <span className="text-[122px] font-black italic text-marvel drop-shadow-[0_0_25px_#f03e3470]">M</span>
          </div>
          <span className="absolute right-0 bottom-[18px] text-right font-mono text-[9px] leading-5 tracking-[.19em] text-muted">CHARACTER<br />DATABASE</span>
          <span className="absolute right-[60px] top-12 text-marvel">✦</span>
        </div>
      </section>

      <section className="py-10 sm:py-12" aria-labelledby="collection-title">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-2 font-mono text-[10px] font-bold tracking-[.1em] text-marvel">THE COLLECTION</p>
            <h2 id="collection-title" className="text-2xl font-bold tracking-[-.04em] sm:text-[30px]">Meet the characters</h2>
          </div>
          <span className="pb-1.5 font-mono text-[10px] tracking-[.1em] text-muted">{characters.length} {characters.length === 1 ? 'RESULT' : 'RESULTS'}</span>
        </div>

        <form className="mb-[26px] flex min-h-[58px] items-center gap-2 border border-line bg-panel p-1.5 pl-3.5 sm:gap-3.5 sm:pl-[18px]" onSubmit={handleSearch}>
          <label className="text-2xl leading-none text-muted" htmlFor="character-search" aria-hidden="true">⌕</label>
          <input
            id="character-search"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-paper outline-none placeholder:text-muted"
            type="search"
            placeholder="Search characters by name..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          {searchInput && (
            <button className="px-1 font-mono text-[9px] font-bold text-muted sm:px-4" type="button" onClick={clearSearch}>CLEAR</button>
          )}
          <button className="min-h-[42px] bg-marvel px-3 font-mono text-[9px] font-bold tracking-[.1em] text-white transition hover:bg-[#e02d27] sm:px-4" type="submit">
            SEARCH <span className="ml-2 text-sm">→</span>
          </button>
        </form>

        {loading && <div className="flex min-h-[130px] items-center justify-center gap-3 border border-dashed border-line text-[13px] text-muted">Loading characters...</div>}
        {!loading && error && (
          <div className="flex min-h-[130px] flex-col items-center justify-center gap-2 border border-dashed border-line px-5 text-center text-[13px] text-muted">
            <strong className="text-paper">Connection needed</strong><span>{error}</span>
          </div>
        )}
        {!loading && !error && characters.length === 0 && (
          <div className="flex min-h-[130px] items-center justify-center border border-dashed border-line px-5 text-center text-[13px] text-muted">
            No characters found. Try another name or clear the search.
          </div>
        )}
        {!loading && !error && characters.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character} onSelect={setSelectedCharacter} />
            ))}
          </div>
        )}
      </section>

      <footer className="flex flex-col justify-between gap-3 border-t border-line py-5 font-mono text-[8px] tracking-[.1em] text-muted sm:flex-row sm:py-6">
        <span>HERO ARCHIVE <span className="px-1.5 text-marvel">/</span> BUILT WITH CURIOSITY</span>
        <span>CHARACTERS AND RELATED IMAGES © MARVEL</span>
      </footer>

      {selectedCharacter && (
        <CharacterDetail character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />
      )}
    </main>
  )
}

export default App

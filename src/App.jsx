import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_ENDPOINT = API_BASE + '/api/marvel/characters'

function pageFromPath(pathname) {
  if (pathname === '/characters') return 'characters'
  if (pathname === '/battle') return 'battle'
  return 'home'
}

// Local, project-made illustrations are the fallback when a character has no image URL.
const localArtwork = {
  1009610: '/character-art/spider-man.svg',
  1009368: '/character-art/iron-man.svg',
  1009220: '/character-art/captain-america.svg',
  1009664: '/character-art/thor.svg',
  1009351: '/character-art/hulk.svg',
  1009189: '/character-art/black-widow.svg',
  1009187: '/character-art/black-panther.svg',
  1009282: '/character-art/doctor-strange.svg',
  1010338: '/character-art/captain-marvel.svg',
  1009562: '/character-art/scarlet-witch.svg',
  1009718: '/character-art/wolverine.svg'
}

function ImageOrPlaceholder({ character, large = false }) {
  const [failedUrl, setFailedUrl] = useState(false)
  const [failedArtwork, setFailedArtwork] = useState(false)
  const artwork = localArtwork[character.id]
  const imageUrl = character.imageUrl && !failedUrl
    ? character.imageUrl
    : (!failedArtwork ? artwork : '')

  useEffect(() => {
    setFailedUrl(false)
    setFailedArtwork(false)
  }, [character.id, character.imageUrl])

  return (
    <div className={large
      ? 'relative min-h-56 overflow-hidden bg-[#211c1b] sm:min-h-[350px]'
      : 'relative min-h-[210px] overflow-hidden bg-[#211c1b]'}>
      {imageUrl ? (
        <img
          className="absolute inset-0 h-full min-h-[inherit] w-full object-cover object-top"
          src={imageUrl}
          alt={character.name}
          onError={() => {
            if (character.imageUrl && !failedUrl) setFailedUrl(true)
            else setFailedArtwork(true)
          }}
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

function PaginationControls({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange, controlId }) {
  if (totalItems === 0) return null

  const firstItem = (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border border-line bg-panel px-3 py-3 sm:px-4" aria-label="Character list pages">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span aria-live="polite">Showing <strong className="text-paper">{firstItem}–{lastItem}</strong> of <strong className="text-paper">{totalItems}</strong></span>
        <label className="flex items-center gap-2" htmlFor={controlId}>
          Per page
          <select
            id={controlId}
            className="min-h-9 border border-line bg-ink px-2 text-paper outline-none focus:border-marvel"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {[12, 24, 48].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="min-h-9 border border-line px-3 font-mono text-[9px] font-bold tracking-[.08em] text-paper transition enabled:hover:border-marvel enabled:hover:text-marvel disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >PREVIOUS</button>
        <span className="min-w-20 text-center font-mono text-[9px] text-muted" aria-current="page">{currentPage} / {totalPages}</span>
        <button
          className="min-h-9 border border-line px-3 font-mono text-[9px] font-bold tracking-[.08em] text-paper transition enabled:hover:border-marvel enabled:hover:text-marvel disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >NEXT</button>
      </div>
    </nav>
  )
}

function CharacterCard({ character, onSelect, onEdit }) {
  return (
    <article className="grid min-h-[210px] grid-cols-[118px_1fr] overflow-hidden border border-line bg-gradient-to-br from-panel to-[#151514] transition hover:-translate-y-0.5 hover:border-[#6c3531] sm:grid-cols-[154px_1fr]">
      <ImageOrPlaceholder character={character} />
      <div className="flex min-w-0 flex-col items-start p-3 sm:p-[18px_17px_15px]">
        <p className="mb-2 font-mono text-[8px] font-bold tracking-[.1em] text-marvel">MARVEL CHARACTER</p>
        <h2 className="text-base font-bold tracking-[-.025em] sm:text-lg">{character.name}</h2>
        {(character.alias || character.realName) && (
          <p className="mt-1 text-[10px] text-muted">{character.alias || character.realName}</p>
        )}
        <p className="my-2.5 line-clamp-3 text-[11px] leading-relaxed text-muted">
          {character.description || 'No character description is available yet.'}
        </p>
        <div className="mt-auto flex w-full items-center justify-between gap-2 border-t border-line pt-2.5">
          <span className="text-[10px] text-paper/90">{character.comicsAvailable ?? 0} comics</span>
          <div className="flex shrink-0 items-center gap-3">
            <button
              className="font-mono text-[8px] font-bold tracking-[.1em] text-muted hover:text-paper"
              type="button"
              onClick={() => onEdit(character)}
              aria-label={`Edit ${character.name}`}
            >
              EDIT
            </button>
            <button
              className="font-mono text-[8px] font-bold tracking-[.1em] text-marvel hover:text-[#ff756b]"
              type="button"
              onClick={() => onSelect(character)}
            >
              VIEW PROFILE <span className="ml-1 text-sm">↗</span>
            </button>
          </div>
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
                <dl className="mb-5 grid w-full grid-cols-1 gap-x-5 gap-y-3 text-xs sm:grid-cols-2">
                  {shown.realName && (
                    <div><dt className="mb-1 font-mono text-[8px] tracking-[.1em] text-muted">REAL NAME</dt><dd>{shown.realName}</dd></div>
                  )}
                  {shown.alias && (
                    <div><dt className="mb-1 font-mono text-[8px] tracking-[.1em] text-muted">ALIAS</dt><dd>{shown.alias}</dd></div>
                  )}
                  {shown.origin && (
                    <div><dt className="mb-1 font-mono text-[8px] tracking-[.1em] text-muted">ORIGIN</dt><dd>{shown.origin}</dd></div>
                  )}
                  {shown.alignment && (
                    <div><dt className="mb-1 font-mono text-[8px] tracking-[.1em] text-muted">ALIGNMENT</dt><dd className="capitalize">{shown.alignment}</dd></div>
                  )}
                  {shown.firstAppearance && (
                    <div className="sm:col-span-2"><dt className="mb-1 font-mono text-[8px] tracking-[.1em] text-muted">FIRST APPEARANCE</dt><dd>{shown.firstAppearance}</dd></div>
                  )}
                </dl>
                {shown.powers?.length > 0 && (
                  <div className="mb-4 w-full">
                    <p className="mb-2 font-mono text-[8px] tracking-[.1em] text-muted">POWERS</p>
                    <div className="flex flex-wrap gap-2">
                      {shown.powers.map((power) => <span key={power} className="border border-line px-2 py-1 text-[10px]">{power}</span>)}
                    </div>
                  </div>
                )}
                {shown.teams?.length > 0 && (
                  <div className="mb-4 w-full">
                    <p className="mb-2 font-mono text-[8px] tracking-[.1em] text-muted">TEAMS</p>
                    <div className="flex flex-wrap gap-2">
                      {shown.teams.map((team) => <span key={team} className="border border-line px-2 py-1 text-[10px]">{team}</span>)}
                    </div>
                  </div>
                )}
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

function CharacterEditor({ character, onClose, onSaved }) {
  const isEditing = Boolean(character)
  const [form, setForm] = useState({
    id: character?.id ?? '',
    name: character?.name ?? '',
    realName: character?.realName ?? '',
    alias: character?.alias ?? '',
    description: character?.description ?? '',
    origin: character?.origin ?? '',
    alignment: character?.alignment || 'hero',
    firstAppearance: character?.firstAppearance ?? '',
    imageUrl: character?.imageUrl ?? '',
    comicsAvailable: character?.comicsAvailable ?? 0,
    powers: character?.powers?.join('\n') ?? '',
    teams: character?.teams?.join('\n') ?? ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      realName: form.realName.trim(),
      alias: form.alias.trim(),
      description: form.description.trim(),
      origin: form.origin.trim(),
      alignment: form.alignment,
      firstAppearance: form.firstAppearance.trim(),
      imageUrl: form.imageUrl.trim(),
      comicsAvailable: Number(form.comicsAvailable),
      powers: form.powers.split(/[\n,]/).map((value) => value.trim()).filter(Boolean),
      teams: form.teams.split(/[\n,]/).map((value) => value.trim()).filter(Boolean)
    }
    if (!isEditing) payload.id = Number(form.id)

    try {
      const response = await fetch(
        isEditing ? `${API_ENDPOINT}/${character.id}` : API_ENDPOINT,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.details?.join(' ') || result.error || 'The character could not be saved.')
      }
      onSaved(result)
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the character API. Make sure the backend is running.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (!saving && event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="my-auto max-h-[calc(100vh-24px)] w-full max-w-2xl overflow-y-auto border border-[#51403d] bg-panel shadow-2xl sm:max-h-[calc(100vh-48px)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <div className="flex items-start justify-between border-b border-line p-5 sm:p-7">
          <div>
            <p className="mb-2 font-mono text-[9px] font-bold tracking-[.12em] text-marvel">CHARACTER DATABASE</p>
            <h2 id="editor-title" className="text-2xl font-bold tracking-[-.04em]">
              {isEditing ? 'Edit character' : 'Add a character'}
            </h2>
          </div>
          <button
            className="grid size-9 place-items-center border border-line text-xl text-muted hover:bg-marvel hover:text-white"
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close character form"
          >
            ×
          </button>
        </div>

        <form className="grid gap-4 p-5 sm:grid-cols-2 sm:gap-5 sm:p-7" onSubmit={handleSubmit}>
          {!isEditing && (
            <label className="grid gap-2 text-xs text-muted">
              Character ID <span className="text-marvel">Required numeric ID</span>
              <input
                className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel"
                type="number"
                min="1"
                step="1"
                required
                value={form.id}
                onChange={(event) => setForm({ ...form, id: event.target.value })}
              />
            </label>
          )}
          <label className={`grid gap-2 text-xs text-muted ${isEditing ? 'sm:col-span-2' : ''}`}>
            Name <span className="text-marvel">Required</span>
            <input
              className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel"
              type="text"
              maxLength="120"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-xs text-muted">
            Real name
            <input
              className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel"
              type="text"
              maxLength="120"
              value={form.realName}
              onChange={(event) => setForm({ ...form, realName: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-xs text-muted">
            Alias
            <input
              className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel"
              type="text"
              maxLength="160"
              value={form.alias}
              onChange={(event) => setForm({ ...form, alias: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-xs text-muted">
            Origin
            <input
              className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel"
              type="text"
              maxLength="1000"
              placeholder="City, planet, or origin story"
              value={form.origin}
              onChange={(event) => setForm({ ...form, origin: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-xs text-muted">
            Alignment
            <select
              className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel"
              value={form.alignment}
              onChange={(event) => setForm({ ...form, alignment: event.target.value })}
            >
              <option value="hero">Hero</option>
              <option value="antihero">Antihero</option>
              <option value="villain">Villain</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grid gap-2 text-xs text-muted sm:col-span-2">
            First appearance
            <input
              className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel"
              type="text"
              maxLength="160"
              placeholder="Issue, chapter, or year"
              value={form.firstAppearance}
              onChange={(event) => setForm({ ...form, firstAppearance: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-xs text-muted sm:col-span-2">
            Image URL <span className="text-muted">Optional; leave blank to use the project’s original character artwork</span>
            <input
              className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel"
              type="url"
              placeholder="https://example.com/character.jpg"
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-xs text-muted">
            Comics available
            <input
              className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel"
              type="number"
              min="0"
              step="1"
              required
              value={form.comicsAvailable}
              onChange={(event) => setForm({ ...form, comicsAvailable: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-xs text-muted">
            Powers <span className="text-muted">One per line or separated by commas</span>
            <textarea
              className="min-h-24 resize-y border border-line bg-ink p-3 text-paper outline-none focus:border-marvel"
              value={form.powers}
              onChange={(event) => setForm({ ...form, powers: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-xs text-muted">
            Teams <span className="text-muted">One per line or separated by commas</span>
            <textarea
              className="min-h-24 resize-y border border-line bg-ink p-3 text-paper outline-none focus:border-marvel"
              value={form.teams}
              onChange={(event) => setForm({ ...form, teams: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-xs text-muted sm:col-span-2">
            Description <span className="text-muted">Optional, up to 2,000 characters</span>
            <textarea
              className="min-h-32 resize-y border border-line bg-ink p-3 text-paper outline-none focus:border-marvel"
              maxLength="2000"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          {error && (
            <p className="text-sm text-marvel sm:col-span-2" role="alert">{error}</p>
          )}
          <div className="flex justify-end gap-3 border-t border-line pt-4 sm:col-span-2">
            <button
              className="min-h-11 border border-line px-4 font-mono text-[9px] font-bold tracking-[.1em] text-muted hover:text-paper"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              CANCEL
            </button>
            <button
              className="min-h-11 bg-marvel px-5 font-mono text-[9px] font-bold tracking-[.1em] text-white hover:bg-[#e02d27] disabled:cursor-wait disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? 'SAVING...' : isEditing ? 'SAVE CHANGES' : 'ADD CHARACTER'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

const powerStatNames = ['intelligence', 'strength', 'speed', 'durability', 'power', 'combat']
const powerStatColors = {
  intelligence: 'bg-sky-400',
  strength: 'bg-rose-500',
  speed: 'bg-amber-400',
  durability: 'bg-emerald-400',
  power: 'bg-violet-400',
  combat: 'bg-orange-400'
}

function buildCharacterOverview(character) {
  const biography = character.biography || {}
  const occupation = character.work?.occupation
  const affiliations = character.connections?.groupAffiliation
  const sentences = []
  const fullName = typeof biography.fullName === 'string' ? biography.fullName.trim() : ''
  const aliases = Array.isArray(biography.aliases)
    ? [...new Set(biography.aliases.filter((alias) => typeof alias === 'string' && alias && alias !== '-' && alias.toLocaleLowerCase() !== character.name?.toLocaleLowerCase()))]
    : []

  if (fullName && fullName !== '-' && fullName.toLocaleLowerCase() !== character.name?.toLocaleLowerCase()) {
    sentences.push(`The biography lists ${fullName} as ${character.name}'s real name.`)
  }
  if (aliases.length) sentences.push(`Other aliases include ${aliases.join(', ')}.`)
  if (biography.publisher && biography.publisher !== '-') {
    const alignment = biography.alignment && biography.alignment !== '-' ? ` The record lists the character's alignment as ${biography.alignment}.` : ''
    sentences.push(`The listed publisher is ${biography.publisher}.${alignment}`)
  }
  if (occupation && occupation !== '-') sentences.push(`Their listed occupation is ${occupation}.`)
  if (affiliations && affiliations !== '-') sentences.push(`Their listed group affiliations include ${affiliations}.`)

  return sentences.join(' ') || `The source record includes appearance, power statistics, and image data for ${character.name}.`
}

function PowerStatBars({ stats = {}, profile = false }) {
  return (
    <div className={`grid gap-x-4 gap-y-2.5 ${profile ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`} aria-label="Character power stats">
      {powerStatNames.map((name) => {
        const value = stats[name]
        const numericValue = Number(value)
        const hasValue = value !== null && value !== undefined && value !== '' && value !== '-' && Number.isFinite(numericValue)
        const rating = hasValue ? Math.max(0, Math.min(100, numericValue)) : 0
        return (
          <div key={name}>
            <div className="mb-1 flex items-center justify-between gap-2 font-mono text-[8px] uppercase tracking-[.05em]">
              <span className="text-muted">{name}</span>
              <span className="text-paper">{hasValue ? value : '—'}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <span className={`block h-full rounded-full transition-[width] duration-500 ${powerStatColors[name]}`} style={{ width: `${rating}%` }} aria-hidden="true" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function UniverseCard({ character, onSelect, onToggleFavorite, isFavorite, favoriteBusy }) {
  const biography = character.biography || {}
  const universe = getUniverseName(biography.publisher)
  const imageUrl = character.images?.md || character.images?.sm
  const powerstats = character.powerstats || {}
  const overview = buildCharacterOverview(character)

  return (
    <article className="grid min-h-[210px] grid-cols-[118px_1fr] overflow-hidden border border-line bg-gradient-to-br from-panel to-[#151514] transition hover:-translate-y-0.5 hover:border-[#6c3531] sm:grid-cols-[154px_1fr]">
      <div className="relative min-h-[210px] overflow-hidden bg-[#211c1b]">
        {imageUrl ? <img className="absolute inset-0 h-full w-full object-cover object-top" src={imageUrl} alt={character.name} loading="lazy" /> : <div className="grid h-full min-h-[210px] place-items-center text-4xl font-extrabold text-[#f3b4a9]/80">{character.name?.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>}
        <span className="absolute bottom-2.5 left-2.5 bg-black/75 px-2 py-1 font-mono text-[9px] text-white">#{character.id}</span>
      </div>
      <div className="flex min-w-0 flex-col items-start p-3 sm:p-[18px_17px_15px]">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex border border-marvel/40 bg-marvel/10 px-2 py-1 font-mono text-[9px] font-bold tracking-[.08em] text-[#ff756b]">{universe.toUpperCase()}</span>
          {biography.publisher && universe !== biography.publisher && <span className="font-mono text-[8px] tracking-[.04em] text-muted">{biography.publisher}</span>}
        </div>
        <h2 className="text-base font-bold tracking-[-.025em] sm:text-lg">{character.name}</h2>
        {biography.fullName && <p className="mt-1 text-[10px] text-muted">{biography.fullName}</p>}
        <p className="my-2.5 line-clamp-3 text-[11px] leading-relaxed text-muted">{overview}</p>
        <div className="mb-3 w-full"><PowerStatBars stats={powerstats} /></div>
        <div className="mt-auto flex w-full items-center justify-between border-t border-line pt-2.5">
          <button className={`font-mono text-[8px] font-bold tracking-[.1em] ${isFavorite ? 'text-[#ff756b]' : 'text-muted hover:text-paper'} disabled:opacity-50`} type="button" onClick={() => onToggleFavorite(character)} disabled={favoriteBusy} aria-pressed={isFavorite} aria-label={isFavorite ? `Remove ${character.name} from favorites` : `Add ${character.name} to favorites`}>
            {isFavorite ? '♥ FAVORITE' : '♡ ADD FAVORITE'}
          </button>
          <button className="font-mono text-[8px] font-bold tracking-[.1em] text-marvel hover:text-[#ff756b]" type="button" onClick={() => onSelect(character)}>VIEW PROFILE <span className="ml-1 text-sm">↗</span></button>
        </div>
      </div>
    </article>
  )
}

function AuthModal({ mode, setMode, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin }
        })
        if (authError) throw authError
        if (!data.session) {
          setMessage('Your account was created. Check your email for a confirmation link, then come back and sign in.')
          return
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
      }
      onClose()
    } catch (authError) {
      setError(authError.message || 'Authentication could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="w-full max-w-md border border-[#51403d] bg-panel p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><p className="mb-2 font-mono text-[9px] font-bold tracking-[.12em] text-marvel">HERO ARCHIVE ACCOUNT</p><h2 id="auth-title" className="text-2xl font-bold">{mode === 'signup' ? 'Create an account' : 'Sign in'}</h2></div>
          <button className="grid size-9 place-items-center border border-line text-xl text-muted hover:bg-marvel hover:text-white" type="button" onClick={onClose} aria-label="Close sign in">×</button>
        </div>
        {!supabase ? (
          <p className="border border-line bg-ink p-4 text-sm leading-relaxed text-muted">Connect this app to Supabase first: copy <code>.env.example</code> to <code>.env.local</code> and add your project URL and publishable key. Then restart the Vite server.</p>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-xs text-muted">Email address<input className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="grid gap-2 text-xs text-muted">Password<input className="min-h-11 border border-line bg-ink px-3 text-paper outline-none focus:border-marvel" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            {error && <p className="text-sm text-marvel" role="alert">{error}</p>}
            {message && <p className="text-sm leading-relaxed text-paper" role="status">{message}</p>}
            <button className="min-h-11 bg-marvel px-4 font-mono text-[10px] font-bold tracking-[.1em] text-white hover:bg-[#e02d27] disabled:opacity-60" type="submit" disabled={busy}>{busy ? 'PLEASE WAIT...' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}</button>
            <p className="text-center text-xs text-muted">{mode === 'signup' ? 'Already have an account?' : 'New to Hero Archive?'} <button className="font-semibold text-paper hover:text-marvel" type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setMessage('') }}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>
          </form>
        )}
      </section>
    </div>
  )
}

function getUniverseName(publisher = '') {
  const normalized = String(publisher || '').trim().toLocaleLowerCase()
  if (normalized === 'marvel comics') return 'Marvel'
  if (normalized === 'dc comics' || normalized === 'wildstorm') return 'DC'
  if (normalized === 'dark horse comics') return 'Dark Horse'
  if (normalized === 'image comics') return 'Image Comics'
  if (normalized === 'idw publishing') return 'IDW'
  if (normalized === 'icon comics') return 'Icon Comics'
  if (normalized === 'george lucas') return 'Star Wars'
  if (normalized === 'star trek') return 'Star Trek'
  if (normalized === 'nbc - heroes') return 'Heroes'
  if (!publisher) return 'Unspecified'
  return 'Other'
}

function UniverseDetail({ character, onClose }) {
  const biography = character.biography || {}
  const appearance = character.appearance || {}
  const powerstats = Object.entries(character.powerstats || {})
  const overview = buildCharacterOverview(character)
  const displayValue = (value) => Array.isArray(value)
    ? value.filter((item) => item && item !== '-').join(' / ')
    : value && value !== '-' ? String(value) : ''
  const sections = [
    ['BIOGRAPHY', [['Publisher', biography.publisher], ['Real name', biography.fullName], ['Aliases', biography.aliases], ['Place of birth', biography.placeOfBirth], ['First appearance', biography.firstAppearance], ['Alignment', biography.alignment]]],
    ['APPEARANCE', [['Gender', appearance.gender], ['Species / race', appearance.race], ['Height', appearance.height], ['Weight', appearance.weight], ['Eye color', appearance.eyeColor], ['Hair color', appearance.hairColor]]],
    ['WORK', [['Occupation', character.work?.occupation], ['Base', character.work?.base]]],
    ['CONNECTIONS', [['Group affiliations', character.connections?.groupAffiliation], ['Relatives', character.connections?.relatives]]]
  ]

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="my-auto max-h-[calc(100vh-24px)] w-full max-w-4xl overflow-y-auto border border-[#51403d] bg-panel shadow-2xl sm:max-h-[calc(100vh-48px)]" role="dialog" aria-modal="true" aria-labelledby="universe-detail-title">
        <div className="grid sm:grid-cols-[.7fr_1.3fr]">
          <div className="relative min-h-64 bg-[#211c1b]">{character.images?.lg || character.images?.md ? <img className="absolute inset-0 h-full w-full object-cover object-top" src={character.images.lg || character.images.md} alt={character.name} /> : <div className="grid h-full min-h-64 place-items-center text-6xl font-black text-marvel">{character.name?.[0]}</div>}<span className="absolute bottom-3 left-3 bg-black/75 px-2 py-1 font-mono text-[9px] text-white">SOURCE ID #{character.id}</span></div>
          <div className="p-5 sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-4"><div><p className="mb-2 font-mono text-[9px] font-bold tracking-[.12em] text-marvel">{getUniverseName(biography.publisher).toUpperCase()} {biography.publisher && getUniverseName(biography.publisher) !== biography.publisher ? `· ${biography.publisher}` : ''}</p><h2 id="universe-detail-title" className="text-3xl font-extrabold tracking-[-.04em]">{character.name}</h2>{biography.fullName && <p className="mt-1 text-sm text-muted">{biography.fullName}</p>}</div><button className="grid size-9 shrink-0 place-items-center border border-line text-xl text-muted hover:bg-marvel hover:text-white" type="button" onClick={onClose} aria-label="Close profile">×</button></div>
            <section className="mb-6 border border-line bg-ink p-4 sm:p-5"><h3 className="mb-2 font-mono text-[9px] font-bold tracking-[.12em] text-marvel">OVERVIEW / SOURCE-BASED SUMMARY</h3><p className="text-xs leading-relaxed text-paper/90">{overview}</p></section>
            <section className="mb-6"><h3 className="mb-3 font-mono text-[9px] tracking-[.12em] text-muted">POWERSTATS / 100</h3><PowerStatBars stats={Object.fromEntries(powerstats)} profile /></section>
            <div className="grid gap-5 sm:grid-cols-2">{sections.map(([title, fields]) => { const visibleFields = fields.map(([label, value]) => [label, displayValue(value)]).filter(([, value]) => value); if (!visibleFields.length) return null; return <section key={title}><h3 className="mb-2 border-b border-line pb-2 font-mono text-[9px] tracking-[.12em] text-muted">{title}</h3><dl className="grid gap-2 text-xs">{visibleFields.map(([label, value]) => <div key={label}><dt className="mb-0.5 text-[10px] text-muted">{label}</dt><dd className="break-words leading-relaxed">{value}</dd></div>)}</dl></section>})}</div>
          </div>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname))
  const [characters, setCharacters] = useState([])
  const [universeCharacters, setUniverseCharacters] = useState([])
  const [universeLoading, setUniverseLoading] = useState(true)
  const [universeError, setUniverseError] = useState('')
  const [universeCount, setUniverseCount] = useState(0)
  const [catalogMode, setCatalogMode] = useState('universe')
  const [universeFilter, setUniverseFilter] = useState('Marvel')
  const [selectedUniverseCharacter, setSelectedUniverseCharacter] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [favoriteBusyIds, setFavoriteBusyIds] = useState(new Set())
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [favoritesError, setFavoritesError] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [universeSearchTerm, setUniverseSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(24)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [characterToEdit, setCharacterToEdit] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    function handlePopState() {
      setPage(pageFromPath(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(event, nextPage) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    const nextPath = nextPage === 'home' ? '/' : `/${nextPage}`
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath)
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
      if (sessionError) setFavoritesError(sessionError.message)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
      if (!session) {
        setFavoriteIds(new Set())
        setShowFavoritesOnly(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !user) {
      setFavoriteIds(new Set())
      setFavoritesLoading(false)
      return
    }

    let active = true
    setFavoritesLoading(true)
    setFavoritesError('')
    supabase.from('favorites').select('character_id').eq('user_id', user.id)
      .then(({ data, error: queryError }) => {
        if (!active) return
        if (queryError) throw queryError
        setFavoriteIds(new Set((data || []).map((row) => Number(row.character_id))))
      })
      .catch((queryError) => {
        if (active) setFavoritesError(queryError.message || 'Could not load your favorites. Run the favorites SQL setup in Supabase.')
      })
      .finally(() => {
        if (active) setFavoritesLoading(false)
      })

    return () => { active = false }
  }, [user])

  useEffect(() => {
    if (page !== 'characters') return undefined
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
  }, [page, searchTerm, refreshKey])

  useEffect(() => {
    const controller = new AbortController()
    setUniverseLoading(true)
    setUniverseError('')

    fetch(API_BASE + '/api/universe/characters', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('The universe catalog could not be loaded.')
        return response.json()
      })
      .then((data) => {
        setUniverseCharacters(data.results || [])
        setUniverseCount(data.count || 0)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setUniverseError('The full catalog has not been imported yet. Follow the setup steps in the backend README, then refresh this page.')
          setUniverseCharacters([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setUniverseLoading(false)
      })

    return () => controller.abort()
  }, [])

  function handleSearch(event) {
    event.preventDefault()
    setCurrentPage(1)
    if (catalogMode === 'universe') setUniverseSearchTerm(searchInput.trim())
    else setSearchTerm(searchInput.trim())
  }

  async function toggleFavorite(character) {
    if (!user || !supabase) {
      setAuthMode('signin')
      setAuthOpen(true)
      return
    }

    const characterId = Number(character.id)
    const removing = favoriteIds.has(characterId)
    setFavoritesError('')
    setFavoriteBusyIds((current) => new Set(current).add(characterId))
    setFavoriteIds((current) => {
      const next = new Set(current)
      if (removing) next.delete(characterId)
      else next.add(characterId)
      return next
    })

    try {
      const result = removing
        ? await supabase.from('favorites').delete().eq('user_id', user.id).eq('character_id', characterId)
        : await supabase.from('favorites').insert({ user_id: user.id, character_id: characterId })
      if (result.error) throw result.error
    } catch (favoriteError) {
      setFavoriteIds((current) => {
        const next = new Set(current)
        if (removing) next.add(characterId)
        else next.delete(characterId)
        return next
      })
      setFavoritesError(favoriteError.message || 'Could not save that favorite. Check the favorites table setup in Supabase.')
    } finally {
      setFavoriteBusyIds((current) => {
        const next = new Set(current)
        next.delete(characterId)
        return next
      })
    }
  }

  function clearSearch() {
    setCurrentPage(1)
    setSearchInput('')
    setSearchTerm('')
    setUniverseSearchTerm('')
  }

  function openEditor(character = null) {
    setCharacterToEdit(character)
    setEditorOpen(true)
  }

  function handleCharacterSaved() {
    setEditorOpen(false)
    setCharacterToEdit(null)
    setSearchInput('')
    setSearchTerm('')
    setUniverseSearchTerm('')
    setRefreshKey((current) => current + 1)
  }

  const normalizedSearch = universeSearchTerm.toLocaleLowerCase()
  const visibleUniverseCharacters = universeCharacters.filter((character) => {
    const biography = character.biography || {}
    const searchValues = [character.name, biography.fullName, biography.publisher, ...(biography.aliases || [])]
    const matchesSearch = !normalizedSearch || searchValues.some((value) => String(value || '').toLocaleLowerCase().includes(normalizedSearch))
    const matchesUniverse = !universeFilter || getUniverseName(biography.publisher) === universeFilter
    const matchesFavorites = !showFavoritesOnly || favoriteIds.has(Number(character.id))
    return matchesSearch && matchesUniverse && matchesFavorites
  })
  const universeCounts = universeCharacters.reduce((counts, character) => {
    const universe = getUniverseName(character.biography?.publisher)
    counts[universe] = (counts[universe] || 0) + 1
    return counts
  }, {})
  const universeOptions = ['Marvel', 'DC', 'Dark Horse', 'Image Comics', 'Star Wars', 'Star Trek', 'Heroes', 'IDW', 'Icon Comics', 'Other', 'Unspecified']
    .filter((universe) => universeCounts[universe])
  const displayedCount = catalogMode === 'universe' ? (universeFilter ? universeCounts[universeFilter] || 0 : universeCount) : characters.length
  const displayedLoading = catalogMode === 'universe' ? universeLoading : loading
  const displayedError = catalogMode === 'universe' ? universeError : error
  const activeCharacters = catalogMode === 'universe' ? visibleUniverseCharacters : characters
  const totalPages = Math.max(1, Math.ceil(activeCharacters.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedCharacters = activeCharacters.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)
  const renderPagination = (controlId) => (
    <PaginationControls
      currentPage={safeCurrentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      totalItems={activeCharacters.length}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      controlId={controlId}
    />
  )

  return (
    <main className="mx-auto w-[calc(100%-28px)] max-w-[1180px] sm:w-[calc(100%-64px)]">
      <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line py-2 sm:min-h-[82px] sm:flex-nowrap sm:py-0">
        <a className="inline-flex items-center gap-3 text-paper no-underline" href="/" onClick={(event) => navigate(event, 'home')} aria-label="Hero Archive home">
          <span className="grid size-[42px] shrink-0 place-items-center overflow-hidden rounded-full bg-black sm:size-[46px]">
            <img className="size-full object-contain" src="/deadpool-logo-cropped.jpg" alt="" aria-hidden="true" />
          </span>
          <span className="text-xs font-black tracking-[.12em]">HERO<span className="text-marvel">ARCHIVE</span></span>
        </a>
        <nav className="order-3 flex basis-full items-center justify-center gap-1 sm:order-2 sm:basis-auto sm:gap-2" aria-label="Main navigation">
          {[
            ['home', 'HOME'],
            ['characters', 'CHARACTERS'],
            ['battle', 'BATTLE']
          ].map(([destination, label]) => (
            <a
              key={destination}
              href={destination === 'home' ? '/' : `/${destination}`}
              onClick={(event) => navigate(event, destination)}
              aria-current={page === destination ? 'page' : undefined}
              className={`px-2 py-2 font-mono text-[8px] font-bold tracking-[.08em] transition sm:px-3 sm:text-[9px] ${page === destination ? 'text-marvel' : 'text-muted hover:text-paper'}`}
            >{label}{destination === 'battle' && <span className="ml-1 hidden text-[7px] text-muted md:inline">SOON</span>}</a>
          ))}
        </nav>
        <div className="order-2 flex items-center gap-2 sm:order-3 sm:gap-5">
          <div className="font-mono text-right text-[8px] tracking-[.1em] text-muted sm:text-[10px]">
            <span className="mr-2 hidden size-[7px] rounded-full bg-[#79c58b] shadow-[0_0_10px_#79c58b88] sm:inline-block" />
            <span className="hidden sm:inline">LOCAL DATABASE</span>
          </div>
          {authLoading ? <span className="font-mono text-[8px] text-muted">ACCOUNT...</span> : user ? <>
            <span className="hidden max-w-40 truncate text-xs text-muted sm:block">{user.email}</span>
            <button className="font-mono text-[9px] font-bold tracking-[.08em] text-muted hover:text-paper" type="button" onClick={() => supabase?.auth.signOut()}>SIGN OUT</button>
          </> : <button className="font-mono text-[9px] font-bold tracking-[.08em] text-marvel hover:text-[#ff756b]" type="button" onClick={() => { setAuthMode('signin'); setAuthOpen(true) }}>SIGN IN</button>}
        </div>
      </header>

      {page === 'home' && <>
      <section className="grid min-h-0 grid-cols-1 items-center gap-0 overflow-hidden border-b border-line md:min-h-[394px] md:grid-cols-[1fr_390px] md:gap-[50px]">
        <div className="py-12 md:py-[55px]">
          <p className="mb-3.5 font-mono text-[10px] font-bold tracking-[.1em] text-marvel">A FULLSTACK DATABASE PROJECT</p>
          <h1 className="text-[clamp(38px,11vw,58px)] font-extrabold leading-[.98] tracking-[-.065em] sm:text-[clamp(52px,7vw,82px)]">
            Every hero has<br /><em className="font-serif font-normal tracking-[-.045em] text-marvel">a story.</em>
          </h1>
          <p className="my-6 max-w-md text-[15px] leading-7 text-muted">
            Explore a complete superhero catalog. Search across publishers and open the source data behind every profile.
          </p>
          <div className="flex items-center gap-4 font-mono text-[9px] tracking-[.1em] text-muted">
            <span>COLLECTION<strong className="mt-1.5 block text-xs text-paper">{universeLoading ? '…' : universeCount.toLocaleString()}</strong></span>
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
      <section className="grid gap-4 py-10 sm:grid-cols-2 sm:py-14">
        <a href="/characters" onClick={(event) => navigate(event, 'characters')} className="group border border-line bg-panel p-6 transition hover:border-marvel sm:p-8">
          <p className="mb-3 font-mono text-[9px] font-bold tracking-[.12em] text-marvel">EXPLORE THE CATALOG</p>
          <h2 className="mb-2 text-2xl font-bold tracking-[-.04em]">Find your favorite heroes</h2>
          <p className="mb-5 max-w-md text-sm leading-relaxed text-muted">Search character names and aliases, browse publishers, and open detailed profiles.</p>
          <span className="font-mono text-[9px] font-bold tracking-[.1em] text-paper group-hover:text-marvel">BROWSE CHARACTERS →</span>
        </a>
        <a href="/battle" onClick={(event) => navigate(event, 'battle')} className="group border border-line bg-panel p-6 transition hover:border-marvel sm:p-8">
          <p className="mb-3 font-mono text-[9px] font-bold tracking-[.12em] text-muted">ON THE ROADMAP</p>
          <h2 className="mb-2 text-2xl font-bold tracking-[-.04em]">Battle mode</h2>
          <p className="mb-5 max-w-md text-sm leading-relaxed text-muted">A future feature for comparing characters and their abilities, built one step at a time.</p>
          <span className="font-mono text-[9px] font-bold tracking-[.1em] text-muted group-hover:text-paper">COMING SOON →</span>
        </a>
      </section>
      <section className="border-t border-line py-10 sm:py-14" aria-labelledby="about-project-title">
        <div className="grid gap-8 md:grid-cols-[1.1fr_.9fr] md:items-start md:gap-14">
          <div>
            <p className="mb-3 font-mono text-[9px] font-bold tracking-[.12em] text-marvel">ABOUT THE PROJECT</p>
            <h2 id="about-project-title" className="mb-4 max-w-xl text-2xl font-bold tracking-[-.04em] sm:text-3xl">A character catalog built across the full stack.</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">Hero Archive brings character data from multiple universes into one searchable catalog. It’s a portfolio project built to demonstrate a React interface, an API, and a PostgreSQL database working together.</p>
          </div>
          <div>
            <h3 className="mb-3 font-mono text-[9px] font-bold tracking-[.12em] text-muted">BUILT WITH</h3>
            <ul className="flex flex-wrap gap-2" aria-label="Project technologies">
              {['React', 'Tailwind CSS', 'Node.js', 'Express', 'Supabase', 'PostgreSQL'].map((technology) => (
                <li key={technology} className="border border-line bg-panel px-3 py-2 font-mono text-[9px] tracking-[.04em] text-paper">{technology}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      </>}

      {page === 'characters' && <>
      <section className="border-b border-line py-8 sm:py-10">
        <p className="mb-2 font-mono text-[9px] font-bold tracking-[.12em] text-marvel">CHARACTER DATABASE</p>
        <h1 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Explore the multiverse</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Search across publishers, filter by universe, and open a character profile to learn more.</p>
      </section>
      <section className="py-10 sm:py-12" aria-labelledby="collection-title">
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Character catalogs">
          <button className={`min-h-10 border px-4 font-mono text-[9px] font-bold tracking-[.1em] ${catalogMode === 'universe' ? 'border-marvel bg-marvel text-white' : 'border-line text-muted hover:text-paper'}`} type="button" aria-pressed={catalogMode === 'universe'} onClick={() => { setCurrentPage(1); setCatalogMode('universe'); setUniverseSearchTerm(searchInput.trim()) }}>FULL UNIVERSE</button>
          <button className={`min-h-10 border px-4 font-mono text-[9px] font-bold tracking-[.1em] ${catalogMode === 'collection' ? 'border-marvel bg-marvel text-white' : 'border-line text-muted hover:text-paper'}`} type="button" aria-pressed={catalogMode === 'collection'} onClick={() => { setCurrentPage(1); setCatalogMode('collection'); setSearchTerm(searchInput.trim()) }}>MY MARVEL COLLECTION</button>
        </div>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-2 font-mono text-[10px] font-bold tracking-[.1em] text-marvel">{catalogMode === 'universe' ? 'THE FULL SOURCE CATALOG' : 'YOUR CURATED MARVEL RECORDS'}</p>
            <h2 id="collection-title" className="text-2xl font-bold tracking-[-.04em] sm:text-[30px]">{catalogMode === 'universe' ? 'Explore the multiverse' : 'Meet the characters'}</h2>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="font-mono text-[10px] tracking-[.1em] text-muted" aria-live="polite">{catalogMode === 'universe' ? visibleUniverseCharacters.length : characters.length} {catalogMode === 'universe' ? (universeSearchTerm ? 'RESULTS' : 'CHARACTERS') : (searchTerm ? 'RESULTS' : 'CHARACTERS')}</span>
            {catalogMode === 'collection' && <button
              className="min-h-10 bg-marvel px-3 font-mono text-[9px] font-bold tracking-[.1em] text-white transition hover:bg-[#e02d27] sm:px-4"
              type="button"
              onClick={() => openEditor()}
            >
              + ADD CHARACTER
            </button>}
          </div>
        </div>

        <form className="mb-[26px] flex min-h-[58px] items-center gap-2 border border-line bg-panel p-1.5 pl-3.5 sm:gap-3.5 sm:pl-[18px]" onSubmit={handleSearch}>
          <label className="text-2xl leading-none text-muted" htmlFor="character-search" aria-hidden="true">⌕</label>
          <input
            id="character-search"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-paper outline-none placeholder:text-muted"
            type="search"
            placeholder={catalogMode === 'universe' ? 'Type a name, real name, or alias...' : 'Search characters by name...'}
            value={searchInput}
            onChange={(event) => {
              const value = event.target.value
              setSearchInput(value)
              if (catalogMode === 'universe') {
                setCurrentPage(1)
                setUniverseSearchTerm(value.trim())
              }
            }}
          />
          {searchInput && (
            <button className="px-1 font-mono text-[9px] font-bold text-muted sm:px-4" type="button" onClick={clearSearch}>CLEAR</button>
          )}
          {catalogMode === 'universe'
            ? <span className="px-2 font-mono text-[9px] font-bold tracking-[.1em] text-muted">LIVE</span>
            : <button className="min-h-[42px] bg-marvel px-3 font-mono text-[9px] font-bold tracking-[.1em] text-white transition hover:bg-[#e02d27] sm:px-4" type="submit">SEARCH <span className="ml-2 text-sm">→</span></button>}
        </form>

        {catalogMode === 'universe' && (
          <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Filter by universe">
            <button className={`min-h-9 border px-3 font-mono text-[9px] font-bold tracking-[.08em] ${universeFilter === '' ? 'border-marvel bg-marvel text-white' : 'border-line text-muted hover:text-paper'}`} type="button" aria-pressed={universeFilter === ''} onClick={() => { setCurrentPage(1); setUniverseFilter('') }}>ALL UNIVERSES <span className="ml-1 opacity-70">{universeCount}</span></button>
            <button className={`min-h-9 border px-3 font-mono text-[9px] font-bold tracking-[.08em] ${showFavoritesOnly ? 'border-marvel bg-marvel text-white' : 'border-line text-muted hover:text-paper'}`} type="button" aria-pressed={showFavoritesOnly} onClick={() => { if (!user) { setAuthMode('signin'); setAuthOpen(true) } else { setCurrentPage(1); setShowFavoritesOnly((current) => !current) } }}>{user ? 'MY FAVORITES' : 'SIGN IN FOR FAVORITES'} <span className="ml-1 opacity-70">{user ? favoriteIds.size : '♡'}</span></button>
            {universeOptions.map((universe) => <button key={universe} className={`min-h-9 border px-3 font-mono text-[9px] font-bold tracking-[.08em] ${universeFilter === universe ? 'border-marvel bg-marvel text-white' : 'border-line text-muted hover:text-paper'}`} type="button" aria-pressed={universeFilter === universe} onClick={() => { setCurrentPage(1); setUniverseFilter(universe) }}>{universe.toUpperCase()} <span className="ml-1 opacity-70">{universeCounts[universe]}</span></button>)}
          </div>
        )}

        {displayedLoading && <div className="flex min-h-[130px] items-center justify-center gap-3 border border-dashed border-line text-[13px] text-muted">Loading characters...</div>}
        {!displayedLoading && displayedError && (
          <div className="flex min-h-[130px] flex-col items-center justify-center gap-2 border border-dashed border-line px-5 text-center text-[13px] text-muted">
            <strong className="text-paper">{catalogMode === 'universe' ? 'Import the full dataset' : 'Connection needed'}</strong><span>{displayedError}</span>
          </div>
        )}
        {favoritesError && catalogMode === 'universe' && <p className="mb-4 text-xs text-marvel" role="alert">{favoritesError}</p>}
        {favoritesLoading && catalogMode === 'universe' && user && <p className="mb-4 text-xs text-muted">Loading your saved favorites...</p>}
        {!displayedLoading && !displayedError && catalogMode === 'collection' && characters.length === 0 && (
          <div className="flex min-h-[130px] items-center justify-center border border-dashed border-line px-5 text-center text-[13px] text-muted">
            No characters found. Try another name or clear the search.
          </div>
        )}
        {!displayedLoading && !displayedError && catalogMode === 'collection' && characters.length > 0 && (
          <div className="mb-4">{renderPagination('characters-per-page-top')}</div>
        )}
        {!displayedLoading && !displayedError && catalogMode === 'collection' && characters.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {paginatedCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onSelect={setSelectedCharacter}
                onEdit={openEditor}
              />
            ))}
          </div>
        )}
        {!displayedLoading && !displayedError && catalogMode === 'universe' && visibleUniverseCharacters.length === 0 && (
          <div className="flex min-h-[130px] items-center justify-center border border-dashed border-line px-5 text-center text-[13px] text-muted">{showFavoritesOnly ? 'You have no matching favorites yet. Use “Add Favorite” on a character card to save one.' : 'No matching characters. Try another search or universe.'}</div>
        )}
        {!displayedLoading && !displayedError && catalogMode === 'universe' && visibleUniverseCharacters.length > 0 && (
          <div className="mb-4">{renderPagination('characters-per-page-top')}</div>
        )}
        {!displayedLoading && !displayedError && catalogMode === 'universe' && visibleUniverseCharacters.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {paginatedCharacters.map((character) => <UniverseCard key={character.id} character={character} onSelect={setSelectedUniverseCharacter} onToggleFavorite={toggleFavorite} isFavorite={favoriteIds.has(Number(character.id))} favoriteBusy={favoriteBusyIds.has(Number(character.id))} />)}
          </div>
        )}
        {!displayedLoading && !displayedError && activeCharacters.length > 0 && (
          <div className="mt-4">{renderPagination('characters-per-page-bottom')}</div>
        )}
      </section>
      </>}

      {page === 'battle' && <section className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center py-16 text-center">
        <span className="mb-6 grid size-20 place-items-center rounded-full border border-marvel/40 bg-panel text-3xl text-marvel" aria-hidden="true">⚔</span>
        <p className="mb-3 font-mono text-[9px] font-bold tracking-[.16em] text-marvel">HERO ARCHIVE / ROADMAP</p>
        <h1 className="mb-4 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Battle mode is coming.</h1>
        <p className="mb-8 max-w-xl text-sm leading-relaxed text-muted">This will be a deeper feature. For now, we’re focusing on building a strong character catalog and clear profiles first.</p>
        <a href="/characters" onClick={(event) => navigate(event, 'characters')} className="bg-marvel px-5 py-3 font-mono text-[9px] font-bold tracking-[.1em] text-white transition hover:bg-[#e02d27]">EXPLORE CHARACTERS →</a>
      </section>}

      {page !== 'battle' && <footer className="flex flex-col justify-between gap-3 border-t border-line py-5 font-mono text-[8px] tracking-[.1em] text-muted sm:flex-row sm:py-6">
        <span>HERO ARCHIVE <span className="px-1.5 text-marvel">/</span> BUILT WITH CURIOSITY</span>
        <span>DATA & IMAGE SOURCE: AKABAB SUPERHERO API <span className="px-1.5 text-marvel">/</span> FAN-MADE PROJECT</span>
      </footer>}

      {selectedCharacter && (
        <CharacterDetail character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />
      )}
      {selectedUniverseCharacter && (
        <UniverseDetail character={selectedUniverseCharacter} onClose={() => setSelectedUniverseCharacter(null)} />
      )}
      {editorOpen && (
        <CharacterEditor
          character={characterToEdit}
          onClose={() => setEditorOpen(false)}
          onSaved={handleCharacterSaved}
        />
      )}
      {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} />}
    </main>
  )
}

export default App

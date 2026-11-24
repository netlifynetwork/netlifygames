import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Gamepad2, Store, Library, Download, Search, Settings, ChevronRight, Star, Clock3, HardDrive, Play, Pause, X, FolderOpen, CheckCircle2, Menu, ArrowDownToLine, Sparkles, MonitorDown } from "lucide-react";
import { games, formatPrice, type Game } from "./catalog";

type DownloadRow = DownloadUpdate & { startedAt: number };
function App() {
  const [query, setQuery] = useState("");
  const [downloads, setDownloads] = useState<DownloadRow[]>([]);
  const [library, setLibrary] = useState<string[]>(["emberfall"]);
  const [notice, setNotice] = useState("");
  const [folder, setFolder] = useState("Downloads/Netlify Games");
  const navigate = useNavigate();

  useEffect(() => {
    const stop = window.gamesDesktop?.onDownloadUpdate(update => setDownloads(rows => {
      const existing = rows.find(row => row.id === update.id);
      if (existing) return rows.map(row => row.id === update.id ? { ...row, ...update } : row);
      return [{ ...update, startedAt: Date.now() }, ...rows];
    }));
    return () => stop?.();
  }, []);

  const startDownload = async (game: Game) => {
    if (!game.downloadUrl) {
      setNotice(`${game.title} is a store demo. Add its licensed HTTPS package URL in src/catalog.ts to enable downloads.`);
      navigate("/downloads");
      return;
    }
    if (!window.gamesDesktop) {
      setNotice("Game downloads are available in the Windows desktop app.");
      navigate("/downloads");
      return;
    }
    try {
      await window.gamesDesktop.startDownload(game.downloadUrl, game.filename || `${game.id}-installer.exe`);
      setLibrary(items => items.includes(game.id) ? items : [...items, game.id]);
      setNotice(`Download started: ${game.title}`);
      navigate("/downloads");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not start download."); }
  };

  const addToLibrary = (game: Game) => {
    setLibrary(items => items.includes(game.id) ? items : [...items, game.id]);
    setNotice(`${game.title} added to your library.`);
  };

  const chooseFolder = async () => {
    const selected = await window.gamesDesktop?.chooseFolder();
    if (selected) { setFolder(selected); setNotice("Download folder updated."); }
  };

  const filtered = useMemo(() => games.filter(game => game.title.toLowerCase().includes(query.toLowerCase()) || game.genre.toLowerCase().includes(query.toLowerCase())), [query]);

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => navigate("/")}><span className="brand-mark"><Gamepad2 size={22}/></span><span>NETLIFY <b>GAMES</b></span></button>
      <nav className="top-nav"><NavLink to="/">STORE</NavLink><NavLink to="/library">LIBRARY</NavLink><NavLink to="/downloads">DOWNLOADS</NavLink></nav>
      <div className="top-actions"><label className="searchbox"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search games"/></label><button className="icon-button" onClick={() => navigate("/settings")} aria-label="Settings"><Settings size={19}/></button></div>
    </header>
    <div className="body-layout">
      <aside className="sidebar">
        <div className="side-label">DISCOVER</div>
        <NavLink to="/" end><Store size={17}/> Store</NavLink>
        <NavLink to="/library"><Library size={17}/> My Library <span className="side-count">{library.length}</span></NavLink>
        <NavLink to="/downloads"><Download size={17}/> Downloads <span className="side-count">{downloads.filter(d => d.state === "progressing").length || ""}</span></NavLink>
        <div className="side-label side-spaced">YOUR COLLECTION</div>
        {games.filter(game => library.includes(game.id)).map(game => <NavLink key={game.id} to={`/game/${game.id}`} className="side-game"><span className="side-dot"/> {game.title}</NavLink>)}
        <div className="sidebar-bottom"><div className="online-dot"/> All systems operational</div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<StorePage games={filtered} onAdd={addToLibrary} onDownload={startDownload}/>}/>
          <Route path="/game/:id" element={<GamePage onAdd={addToLibrary} onDownload={startDownload} library={library}/>}/>
          <Route path="/library" element={<LibraryPage library={library} onOpen={id => navigate(`/game/${id}`)}/>}/>
          <Route path="/downloads" element={<DownloadsPage downloads={downloads} folder={folder} onFolder={chooseFolder}/>}/>
          <Route path="/settings" element={<SettingsPage folder={folder} onFolder={chooseFolder}/>}/>
          <Route path="*" element={<StorePage games={filtered} onAdd={addToLibrary} onDownload={startDownload}/>}/>
        </Routes>
      </main>
    </div>
    {notice && <div className="toast" onClick={() => setNotice("")}>{notice}<button aria-label="Dismiss"><X size={15}/></button></div>}
  </div>;
}

function GameCard({ game, onAdd }: { game: Game; onAdd: (game: Game) => void }) {
  const navigate = useNavigate();
  return <article className="game-card" onClick={() => navigate(`/game/${game.id}`)}>
    <img src={game.image} alt="" loading="lazy"/><div className="game-card-info"><div className="game-card-title">{game.title}</div><div className="game-card-meta">{game.genre}<span>{formatPrice(game.price)}</span></div></div>
    <button className="card-add" onClick={e => { e.stopPropagation(); onAdd(game); }} title="Add to library"><Library size={15}/></button>
  </article>;
}

function StorePage({ games: visibleGames, onAdd, onDownload }: { games: Game[]; onAdd: (game: Game) => void; onDownload: (game: Game) => void }) {
  const featured = games[0];
  return <div className="page-wrap">
    <div className="page-heading"><div><div className="eyebrow">YOUR NEXT ADVENTURE STARTS HERE</div><h1>Discover your next <span>favorite game.</span></h1><p>Explore new worlds, find your next challenge and build your collection.</p></div><div className="platform-pill"><MonitorDown size={16}/> WINDOWS STORE</div></div>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(8,13,20,.96) 0%,rgba(8,13,20,.72) 48%,rgba(8,13,20,.08) 100%),url(${featured.banner})` }}>
      <div className="hero-content"><span className="hero-kicker"><Sparkles size={14}/> FEATURED GAME</span><h2>{featured.title}</h2><p>{featured.description}</p><div className="hero-tags">{featured.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="hero-buttons"><button className="primary-button" onClick={() => onDownload(featured)}><ArrowDownToLine size={17}/> {featured.price === 0 ? "Get game" : "Buy now"} · {formatPrice(featured.price)}</button><button className="secondary-button" onClick={() => onAdd(featured)}>Add to library</button></div></div>
      <div className="hero-index">01 <span>/ 04</span></div>
    </section>
    <div className="section-heading"><div><div className="eyebrow">HAND-PICKED FOR YOU</div><h2>Featured & recommended</h2></div><span className="section-link">Explore collection <ChevronRight size={16}/></span></div>
    <div className="game-grid">{visibleGames.map(game => <GameCard key={game.id} game={game} onAdd={onAdd}/>)}</div>
    {visibleGames.length === 0 && <div className="empty-state"><Search size={28}/><h3>No games found</h3><p>Try another title or genre.</p></div>}
    <div className="section-heading smaller"><div><div className="eyebrow">MORE TO EXPLORE</div><h2>Browse by category</h2></div></div>
    <div className="category-row">{["Action","Adventure","Racing","Strategy","Survival","Role-playing"].map((tag,i)=><div className="category-tile" key={tag}><span>0{i+1}</span><b>{tag}</b><ChevronRight size={16}/></div>)}</div>
  </div>;
}

function GamePage({ onAdd, onDownload, library }: { onAdd: (game: Game) => void; onDownload: (game: Game) => void; library: string[] }) {
  const { id } = useParams(); const game = games.find(item => item.id === id);
  if (!game) return <div className="empty-state"><h2>Game not found</h2><NavLink to="/">Back to store</NavLink></div>;
  return <div className="detail-page">
    <div className="detail-banner" style={{ backgroundImage: `linear-gradient(0deg,#111820 0%,rgba(17,24,32,.1) 75%),url(${game.banner})` }}><span className="hero-kicker">NETLIFY GAMES STORE</span><h1>{game.title}</h1></div>
    <div className="detail-layout"><div className="detail-main"><div className="detail-tags">{game.tags.map(tag=><span key={tag}>{tag}</span>)}</div><h2>About this game</h2><p className="description">{game.description}</p><div className="detail-facts"><div><span>DEVELOPER</span><b>{game.developer}</b></div><div><span>RELEASE DATE</span><b>{game.release}</b></div><div><span>DOWNLOAD SIZE</span><b>{game.size}</b></div></div><h2>System requirements</h2><p className="muted">Windows 10/11 64-bit · Requirements vary by game. Check the developer's official specifications before installing.</p></div>
      <aside className="purchase-panel"><img src={game.image} alt=""/><h3>{game.title}</h3><div className="rating"><Star size={15} fill="currentColor"/> {game.rating}</div><div className="price-line">{formatPrice(game.price)}</div><button className="primary-button full" onClick={() => onDownload(game)}><Download size={17}/>{game.price === 0 ? "Download" : "Purchase & download"}</button><button className="secondary-button full" onClick={() => onAdd(game)}>{library.includes(game.id) ? "In your library" : "Add to library"}</button><div className="purchase-note"><CheckCircle2 size={15}/> One place for your games</div></aside>
    </div>
  </div>;
}

function LibraryPage({ library, onOpen }: { library: string[]; onOpen: (id: string) => void }) {
  const owned = games.filter(game => library.includes(game.id));
  return <div className="page-wrap"><div className="eyebrow">YOUR COLLECTION</div><h1 className="page-title">My Library</h1><p className="page-subtitle">Your games, all in one place.</p>
    {owned.length ? <div className="library-list">{owned.map(game=><div className="library-row" key={game.id}><img src={game.image} alt=""/><div className="library-info"><b>{game.title}</b><span>{game.genre} · {game.size}</span></div><span className="installed-label"><span/> In library</span><button className="secondary-button" onClick={()=>onOpen(game.id)}>View game <ChevronRight size={15}/></button></div>)}</div> : <div className="empty-state"><Library size={30}/><h3>Your library is waiting</h3><p>Add games from the store to see them here.</p><NavLink className="primary-button" to="/">Browse store</NavLink></div>}
  </div>;
}

function DownloadsPage({ downloads, folder, onFolder }: { downloads: DownloadRow[]; folder: string; onFolder: () => void }) {
  const [actionError, setActionError] = useState("");
  const doAction = async (fn: (() => Promise<void>) | undefined) => { try { await fn?.(); } catch (e) { setActionError(e instanceof Error ? e.message : "Download action failed."); } };
  return <div className="page-wrap"><div className="eyebrow">DOWNLOAD MANAGER</div><h1 className="page-title">Downloads</h1><p className="page-subtitle">Manage game downloads and find your installed files.</p>
    <div className="download-toolbar"><div><b>Download location</b><span>{folder}</span></div><button className="secondary-button" onClick={onFolder}><FolderOpen size={16}/> Change folder</button></div>
    {actionError && <p className="error-text">{actionError}</p>}
    {downloads.length ? <div className="download-list">{downloads.map(item=><div className="download-item" key={item.id}><div className="download-icon"><Download size={19}/></div><div className="download-details"><div className="download-title">{item.filename}</div><div className="download-status">{item.state === "completed" ? "Completed" : item.state === "interrupted" ? "Interrupted" : item.state === "cancelled" ? "Cancelled" : "Downloading"} · {formatBytes(item.receivedBytes)}{item.totalBytes ? ` / ${formatBytes(item.totalBytes)}` : ""}</div><div className="progress-track"><div className="progress-fill" style={{width:`${item.percent}%`}}/></div></div><b className="percent">{item.percent}%</b><div className="download-actions">{item.state === "progressing" && <><button title="Pause" onClick={()=>doAction(()=>window.gamesDesktop?.pauseDownload(item.id))}><Pause size={16}/></button><button title="Cancel" onClick={()=>doAction(()=>window.gamesDesktop?.cancelDownload(item.id))}><X size={16}/></button></>}{item.state === "interrupted" && <button title="Resume" onClick={()=>doAction(()=>window.gamesDesktop?.resumeDownload(item.id))}><Play size={16}/></button>}{item.state === "completed" && item.path && <button title="Open file" onClick={()=>doAction(()=>window.gamesDesktop?.openFile(item.path!))}><FolderOpen size={16}/></button>}</div></div>)}</div> : <div className="empty-state"><Download size={32}/><h3>No downloads yet</h3><p>When you download a game, its progress will appear here.</p><NavLink className="primary-button" to="/">Explore games</NavLink></div>}
    <div className="download-tip"><CheckCircle2 size={17}/><span><b>Tip:</b> Keep Netlify Games open while a download is running. Downloads are saved to your selected folder.</span></div>
  </div>;
}
function formatBytes(bytes: number) { if (!bytes) return "0 B"; const units=["B","KB","MB","GB"]; const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),3); return `${(bytes/Math.pow(1024,i)).toFixed(1)} ${units[i]}`; }

function SettingsPage({ folder, onFolder }: { folder: string; onFolder: () => void }) {
  return <div className="page-wrap"><div className="eyebrow">PREFERENCES</div><h1 className="page-title">Settings</h1><p className="page-subtitle">Configure your Netlify Games experience.</p><div className="settings-card"><div><h3>Download location</h3><p>Choose where game installers and files are saved.</p><code>{folder}</code></div><button className="secondary-button" onClick={onFolder}><FolderOpen size={16}/> Browse</button></div><div className="settings-card"><div><h3>About Netlify Games</h3><p>Version 0.1.0 · Windows desktop</p><p className="muted">A home for discovering and managing your PC games.</p></div><Gamepad2 size={28} className="settings-logo"/></div></div>;
}

export default App;
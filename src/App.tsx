import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useMyName } from './hooks';
import { NameSetup } from './components/NameSetup';
import { NavBar } from './components/NavBar';
import { Dashboard } from './pages/Dashboard';
import { LendCard } from './pages/LendCard';
import { Import } from './pages/Import';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

function App() {
  const { name, loading, updateName } = useMyName();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!name) {
    return <NameSetup onSave={updateName} />;
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col h-full">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lend" element={<LendCard />} />
            <Route path="/import" element={<Import />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <NavBar />
      </div>
    </BrowserRouter>
  );
}

export default App;

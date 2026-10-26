import { Routes, Route } from 'react-router-dom'
import { WaterQualityProvider } from './context/WaterQualityContext'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import HistoryDetail from './pages/HistoryDetail'
import Analytics from './pages/Analytics'
import WhoStandards from './pages/WhoStandards'
import Prognosis from './pages/Prognosis'
import Header from './components/Header'
import BottomNav from './components/BottomNav'

function App() {
    return (
        <WaterQualityProvider>
            <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen pb-32 transition-colors duration-500">
                <Header />
                <main className="pt-24 px-6 max-w-5xl mx-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/history/:id" element={<HistoryDetail />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/who-standards" element={<WhoStandards />} />
                        <Route path="/prognosis" element={<Prognosis />} />
                    </Routes>
                </main>
                <BottomNav />
            </div>
        </WaterQualityProvider>
    )
}

export default App

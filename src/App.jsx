import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProjectView from './components/ProjectView'
import PeoplePage from './components/PeoplePage'
import PersonView from './components/PersonView'
import TemplatesPage from './components/TemplatesPage'
import GuidePage from './components/GuidePage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/yoga-tribe-pm">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectView />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/person/:id" element={<PersonView />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/guide" element={<GuidePage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  )
}

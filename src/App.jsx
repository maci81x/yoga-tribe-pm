import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProjectView from './components/ProjectView'
import PeoplePage from './components/PeoplePage'
import TemplatesPage from './components/TemplatesPage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/yoga-tribe-pm">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectView />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/templates" element={<TemplatesPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  )
}

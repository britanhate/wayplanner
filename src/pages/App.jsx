import { useState } from 'react'
import Topbar from '../components/UI/Topbar'
import MapView from '../components/Map/MapView'
import NotesView from '../components/Notes/NotesView'
import FinanceView from '../components/Finance/FinanceView'

export default function App() {
  const [activeTab, setActiveTab] = useState('map')

  return (
    <div className="app">
      <Topbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="content">
        {activeTab === 'map'     && <MapView />}
        {activeTab === 'notes'   && <NotesView />}
        {activeTab === 'finance' && <FinanceView />}
      </div>
    </div>
  )
}

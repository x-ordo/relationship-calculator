import { createRoot } from 'react-dom/client'
import { App } from './app'
import './styles/main.css'

createRoot(document.getElementById('app')!).render(<App />)

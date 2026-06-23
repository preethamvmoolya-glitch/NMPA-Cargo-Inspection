import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { setupLocalDbFetch } from './localDb.js'

// Initialize the local storage database and mock fetch intercepts
setupLocalDbFetch();

// Inject port background URL as CSS variable (works with any base path)
const portBgUrl = `${import.meta.env.BASE_URL}port-bg.png`;
document.documentElement.style.setProperty('--port-bg-url', `url('${portBgUrl}')`);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

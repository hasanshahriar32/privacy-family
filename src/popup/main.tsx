import { createRoot } from 'react-dom/client'
import '../globals.css'
import Popup from './Popup'
import { ExtensionClerkProvider } from '../lib/clerk-provider'

const container = document.getElementById('app')!
const root = createRoot(container)

root.render(
  <ExtensionClerkProvider>
    <Popup />
  </ExtensionClerkProvider>
)

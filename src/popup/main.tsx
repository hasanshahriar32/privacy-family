import { createRoot } from 'react-dom/client'
import '../globals.css'
import Popup from './Popup'

const container = document.getElementById('app')!
const root = createRoot(container)

root.render(<Popup />)

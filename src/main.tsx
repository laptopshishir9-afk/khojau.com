import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl && !(window as any).__khojauMounted) {
  (window as any).__khojauMounted = true;
  createRoot(rootEl).render(<App />);
}

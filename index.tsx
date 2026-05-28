import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
<<<<<<< HEAD
root.render(<App />);
=======
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 若你有 Tailwind / 全域 CSS，通常會在這裡引入：
// import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

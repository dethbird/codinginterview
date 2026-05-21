import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import Products from './routes/Products';
import Favorites from './routes/Favorites';


import './App.css'

function App() {

  return (
    <BrowserRouter>
      <section id="header">
        <h1>Favorite Products Manager</h1>
      </section>
      <nav>
        <Link to="/">Products</Link>
        {" | "}
        <Link to="/favorites">Favorites: (0)</Link>
      </nav>
      <div className="ticks"></div>
      
      <section id="routes">
      <Routes>
        <Route 
          path="/"
          element={<Products />}
        />
        <Route 
          path="/favorites"
          element={<Favorites />}
        />
      </Routes>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </BrowserRouter>
  )
}

export default App

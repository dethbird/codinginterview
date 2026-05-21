import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import Products from './routes/Products';
import Favorites from './routes/Favorites';

import type { Favorite } from './types'

import './App.css'

function App() {

  const [ favorites, setFavorites ] = useState<Favorite[]>([]);

  console.log('favorites', favorites);

  return (
    <BrowserRouter>
      <section id="header">
        <h1>Favorite Products Manager</h1>
      </section>
      <nav>
        <Link to="/">Products</Link>
        {" | "}
        <Link to="/favorites">Favorites: ({favorites.length})</Link>
      </nav>
      <div className="ticks"></div>
      
      <section id="routes">
      <Routes>
        <Route 
          path="/"
          element={<Products 
            setFavorites={setFavorites}
          />}
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

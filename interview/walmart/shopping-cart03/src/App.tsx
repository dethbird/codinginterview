import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Nav from './components/Nav'

import Products from './routes/Products'
import Cart from './routes/Cart'

import './App.css'

function App() {

  return (
    <BrowserRouter>
      <h1>Store</h1>

      <div className="ticks"></div>

      <section>
        <Nav />
      </section>

      <div className="ticks"></div>

      <section id="routes">
        <Routes>
          <Route 
            path="/"
            element={ <Products /> }
          />
          <Route 
            path="/cart"
            element={ <Cart /> }
          />
        </Routes>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </BrowserRouter>
  )
}

export default App

import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Nav from './components/Nav'
import Products from './routes/Products'
import Cart from './routes/Cart'

import type { CartItem } from './types'

import './App.css'

function App() {

  const [cart, setCart] = useState<CartItem[]>([])

  return (
    <>

      <BrowserRouter>
        <h1>Store</h1>
        <Nav
          cart={cart}
        />
        <hr />
        <Routes>
          <Route
            path="/"
            element={
              <Products
                setCart={setCart}
              />}
          />
          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
              />}
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

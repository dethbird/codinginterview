import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Nav from './components/Nav'
import Products from './routes/Products'
import Cart from './routes/Cart'

import './App.css'

function App() {
  return (
    <>

      <BrowserRouter>
        <h1>Store</h1>
        <Nav />
        <hr />
        <Routes>
          <Route
            path="/"
            element={<Products />}
          />
          <Route
            path="/cart"
            element={<Cart />}
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Products from './routes/Products'
import Cart from './routes/Cart'

import './App.css'

function App() {
  return (
    <>
      <h1>Store</h1>
      <BrowserRouter>
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
      </BrowserRouter>
    </>
  )
}

export default App

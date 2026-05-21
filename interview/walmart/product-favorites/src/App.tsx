import { BrowserRouter } from 'react-router-dom'

import './App.css'

function App() {

  return (
    <BrowserRouter>
      <section id="header">
        <h1>Favorite Products Manager</h1>
      </section>
      <nav>
        Products
        {" | "}
        Favorites: (0)
      </nav>
      <div className="ticks"></div>

      <section id="product_list">
        products
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </BrowserRouter>
  )
}

export default App

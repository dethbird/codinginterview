import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Nav from './components/Nav'

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
        
        <div>routes</div>
        <Routes>
          <Route>routes</Route>
        </Routes>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </BrowserRouter>
  )
}

export default App

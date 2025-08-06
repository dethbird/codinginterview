
import { BrowserRouter, Routes, Route } from "react-router";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home2 />} />
        <Route path="/test1" element={<Test1 />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home2() {
  return <h2>Home2!!</h2>;
}
function Test1() {
  return <h2>Test1</h2>;
}
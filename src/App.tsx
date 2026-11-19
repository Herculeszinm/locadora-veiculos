
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { MarcaList } from "./pages/marcas/MarcaList";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/marcas" replace />} />
        <Route path="/marcas" element={<MarcaList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

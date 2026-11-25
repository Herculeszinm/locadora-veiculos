
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { MarcaList } from "./pages/marcas/MarcaList";
import { CategoriaList } from "./pages/categorias/CategoriaList";
import { ModeloList } from "./pages/modelos/ModeloList";
import { VeiculoList } from "./pages/veiculos/VeiculoList";
import { ManutencaoList } from "./pages/manutencoes/ManutencaoList";
import { ClienteList } from "./pages/clientes/ClienteList";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/clientes" element={<ClienteList />} />
        <Route path="/manutencoes" element={<ManutencaoList />} />
        <Route path="/veiculos" element={<VeiculoList />} />
        <Route path="/modelos" element={<ModeloList />} />
        <Route path="/categorias" element={<CategoriaList />} />
        <Route path="/" element={<Navigate to="/marcas" replace />} />
        <Route path="/marcas" element={<MarcaList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

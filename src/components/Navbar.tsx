
import { NavLink } from "react-router-dom";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title = "Locadora de Veículos" }: NavbarProps) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <span className="navbar-brand">{title}</span>

        <div className="d-flex flex-wrap gap-3">
          <NavLink className="nav-link text-white" to="/">
            Início
          </NavLink>

          <NavLink className="nav-link text-white" to="/marcas">
            Marcas
          </NavLink>

          <NavLink className="nav-link text-white" to="/categorias">
            Categorias
          </NavLink>

          <NavLink className="nav-link text-white" to="/modelos">
            Modelos
          </NavLink>

          <NavLink className="nav-link text-white" to="/veiculos">
            Veículos
          </NavLink>

          <NavLink className="nav-link text-white" to="/clientes">
            Clientes
          </NavLink>

          <NavLink className="nav-link text-white" to="/manutencoes">
            Manutenções
          </NavLink>

          <NavLink className="nav-link text-white" to="/locacoes">
            Locações
          </NavLink>
          <NavLink className="nav-link text-white" to="/vistorias">
            Vistorias e Devoluções
          </NavLink>
          <NavLink className="nav-link text-white" to="/pagamentos">
            Pagamentos
          </NavLink>
          <NavLink className="nav-link text-white" to="/notas-fiscais">
            Notas Fiscais
          </NavLink>
          <NavLink className="nav-link text-white" to="/notas-fiscais">
            Notas Fiscais
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

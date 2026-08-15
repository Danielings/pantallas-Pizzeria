import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useApp, AppProvider } from "./context/AppContext";
import NuevaOrdenScreen from "./screens/NuevaOrdenScreen";
import ColaTrabajoScreen from "./screens/ColaTrabajoScreen";
import ClientesScreen from "./screens/ClientesScreen";
import DeliveryScreen from "./screens/DeliveryScreen";
import EntregaScreen from "./screens/EntregaScreen";
import CierreScreen from "./screens/CierreScreen";

import CocineroScreen from "./screens/CocineroScreen";
import DespachoScreen from "./screens/DespachoScreen";
import AdminScreen from "./screens/AdminScreen";
import LoginScreen from "./screens/LoginScreen";
import Sidebar from "./components/layout/Sidebar";
import MeseroScreen from "./screens/MeseroScrenn";
import NuevaPasswordScreen from "./screens/NuevaPasswordScreen";
import RecuperarPasswordScreen from "./screens/RecuperarPasswordScrenn";
import { Toaster } from "react-hot-toast";

const ROLE_HOME = {
  admin: "/dashboard",
  cashier: "/nueva-orden",
  chef: "/cocina",
  despachador: "/despacho",
  mesero: "/mesero",
  waiter: "/mesero",
};

function LoginRoute() {
  const { currentUser } = useApp();

  if (currentUser) {
    return <Navigate to={ROLE_HOME[currentUser.role] || "/login"} replace />;
  }

  return <LoginScreen />;
}

function ProtectedRoute({ roles }) {
  const { currentUser } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to={ROLE_HOME[currentUser.role] || "/login"} replace />;
  }

  return <Outlet />;
}

function AuthenticatedLayout() {
  const { currentUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = location.pathname.slice(1) || "nueva-orden";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {currentUser.role !== "chef" &&
        currentUser.role !== "despachador" &&
        currentUser.role !== "mesero" && (
          <Sidebar
            module={currentUser.role}
            activeView={activeView}
            onNavigate={(view) => navigate(`/${view}`)}
          />
        )}

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/nueva-password" element={<NuevaPasswordScreen />} />
          <Route
            path="/recuperar-password"
            element={<RecuperarPasswordScreen />}
          />

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route element={<AuthenticatedLayout />}>
              <Route
                path="/dashboard"
                element={<AdminScreen activeView="dashboard" />}
              />
              <Route
                path="/reportes"
                element={<AdminScreen activeView="reportes" />}
              />
              <Route
                path="/personal"
                element={<AdminScreen activeView="personal" />}
              />
              <Route
                path="/bitacora"
                element={<AdminScreen activeView="bitacora" />}
              />
              <Route path="/clientes" element={<ClientesScreen />} />
              <Route
                path="/clientes-top"
                element={<AdminScreen activeView="clientes-top" />}
              />
              <Route
                path="/productos"
                element={<AdminScreen activeView="productos" />}
              />
              <Route
                path="/cierres"
                element={<AdminScreen activeView="cierres" />}
              />
              <Route path="/tasa" element={<AdminScreen activeView="tasa" />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["cashier"]} />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/nueva-orden" element={<NuevaOrdenScreen />} />
              <Route path="/cola-trabajos" element={<ColaTrabajoScreen />} />
              <Route path="/entrega" element={<EntregaScreen />} />
              <Route path="/cierre" element={<CierreScreen />} />

            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["chef"]} />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/cocina" element={<CocineroScreen />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={["despachador"]} />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/despacho" element={<DespachoScreen />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={["mesero", "waiter"]} />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/mesero" element={<MeseroScreen />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "text-sm font-semibold rounded-xl shadow-lg border border-gray-100",
          style: {
            background: "#ffffff",
            color: "#1f2937",
            padding: "12px 16px",
          },
          success: {
            iconTheme: { primary: "#059669", secondary: "#ffffff" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#ffffff" },
          },
        }}
      />
    </AppProvider>
  );
}

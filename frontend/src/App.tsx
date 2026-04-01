import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { useAuth } from './context/AuthContext';

function App() {
  const { auth } = useAuth();
  return auth ? <Dashboard /> : <LoginForm />;
}

export default App;

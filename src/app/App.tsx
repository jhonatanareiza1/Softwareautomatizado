import AppRouter from '../routes/AppRouter';

import {
  AuthProvider,
} from '../features/auth/context/AuthContext';

import '../styles/_main.scss';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
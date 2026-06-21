/**
 * Application routes.
 */
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import Today from './pages/Today';
import Quests from './pages/Quests';
import Character from './pages/Character';
import SkillTree from './pages/SkillTree';
import Review from './pages/Review';
import Settings from './pages/Settings';
import Mira from './pages/Mira';
import Focus from './pages/Focus';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Today /> },
      { path: 'quests', element: <Quests /> },
      { path: 'character', element: <Character /> },
      { path: 'mira', element: <Mira /> },
      { path: 'skills', element: <SkillTree /> },
      { path: 'review', element: <Review /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
  { path: '/focus/:questId', element: <Focus /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}

export default App;

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DailyInput } from './pages/DailyInput';
import { ImportData } from './pages/ImportData';
import { MonthlyRecap } from './pages/MonthlyRecap';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="input" element={<DailyInput />} />
          <Route path="recap" element={<MonthlyRecap />} />
          <Route path="import" element={<ImportData />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

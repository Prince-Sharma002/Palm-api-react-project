import './App.css';
import Palmapi from './Components/Palmapi';

function App() {
  return (
    <div className="App">
      <div className="hexagon-overlay"></div>
      <div className="scan-line"></div>
      <Palmapi />
    </div>
  );
}

export default App;

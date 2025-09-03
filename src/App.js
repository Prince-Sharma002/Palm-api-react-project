import './App.css';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Palmapi from './Components/Palmapi';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <div className="hexagon-overlay"></div>
        <div className="scan-line"></div>
        <Palmapi />
      </div>
    </Provider>
  );
}

export default App;

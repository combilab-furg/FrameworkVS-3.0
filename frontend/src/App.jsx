import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import './styles/globals.css'
import Home from "./pages/Home";
import NewDocking from "./pages/NewDocking";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new-docking" element={<NewDocking />} />
      </Routes>
    </Router>
  );
}

export default App;

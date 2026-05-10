import { Routes, Route } from "react-router-dom";
import Home from "./components/login/Login";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </main>
  );
}

export default App;

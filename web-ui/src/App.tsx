import Game from "./components/game/Game";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <div className="App">
      <Game />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

export default App;

import { Route, Switch, Router } from "wouter";
import Home from "./pages/Home";
import Genre from "./pages/Genre";
import Playlist from "./pages/Playlist";
import Settings from "./pages/Settings";

// Use hash-based routing for GitHub Pages compatibility
import { useHashLocation } from "wouter/use-hash-location";

export default function App() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/genre/:genre" component={Genre} />
        <Route path="/playlist" component={Playlist} />
        <Route path="/settings" component={Settings} />
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-text-muted">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Router>
  );
}

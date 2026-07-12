import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import Genre from "./pages/Genre";
import Playlist from "./pages/Playlist";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/genre/:genre" component={Genre} />
      <Route path="/playlist" component={Playlist} />
      <Route>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-text-muted">Page not found</p>
        </div>
      </Route>
    </Switch>
  );
}

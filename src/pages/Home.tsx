import { useNavigate } from "react-router-dom";
import { Shield, Clock, Snowflake } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <img src={cooqLogo} alt="Cooq" className="h-8" />
        <button
          onClick={() => navigate("/search")}
          className="bg-copper text-accent-foreground font-body font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          Find Your Cook
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="font-display italic text-4xl md:text-5xl text-foreground leading-tight mb-4">
            Home Cooked.<br />The way it should be.
          </h1>
          <p className="font-body text-muted-foreground text-lg mb-8 leading-relaxed">
            Vetted personal cooks for Dubai families. Fresh meals, labelled containers, your fridge sorted.
          </p>
          <button
            onClick={() => navigate("/search")}
            className="bg-copper text-accent-foreground font-body font-semibold px-8 py-4 rounded-lg text-lg hover:opacity-90 transition-opacity"
          >
            Find Your Cook →
          </button>
        </div>

        {/* Trust icons */}
        <div className="grid grid-cols-1 gap-6 mt-16 max-w-sm mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-body text-sm text-foreground">Every cook is Cooq Certified</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <span className="font-body text-sm text-foreground">Flexible once, twice or 3× per week</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Snowflake className="w-5 h-5 text-primary" />
            </div>
            <span className="font-body text-sm text-foreground">Labelled containers, fridge-ready</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 font-body text-xs text-muted-foreground tracking-wide">
        cooq.ae · Dubai · 2025
      </footer>
    </div>
  );
};

export default Home;

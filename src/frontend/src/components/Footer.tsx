export default function Footer() {
  const year = new Date().getFullYear();
  const utm = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="bg-card border-t border-border mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-white font-display font-bold text-[10px] leading-none">
                H&F
              </span>
            </div>
            <div>
              <span className="font-display font-bold text-sm text-foreground">
                H&F Society
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                Door Stylist — Listino Prezzi Posa
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © {year} — Tutti i prezzi sono IVA esclusa. Built with ❤️ using{" "}
            <a
              href={utm}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

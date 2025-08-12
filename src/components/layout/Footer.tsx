export default function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="container py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} PetLink DZ</p>
        <nav className="flex gap-4">
          <a className="hover:underline" href="/policies">Policies</a>
          <a className="hover:underline" href="/help">Help</a>
        </nav>
      </div>
    </footer>
  );
}

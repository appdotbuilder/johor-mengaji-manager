import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, BookOpen } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gray-900">RumahMengaji</span>
              <span className="text-xs text-emerald-600 -mt-1">Management System</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              Laman Utama
            </Link>
            <Link to="#features" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              Ciri-ciri
            </Link>
            <Link to="#about" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              Tentang
            </Link>
            <Link to="#contact" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              Hubungi
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button asChild variant="ghost" className="text-gray-700">
              <Link to="/login">Log Masuk</Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/register">Daftar</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-emerald-100 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Laman Utama
              </Link>
              <Link 
                to="#features" 
                className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Ciri-ciri
              </Link>
              <Link 
                to="#about" 
                className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Tentang
              </Link>
              <Link 
                to="#contact" 
                className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Hubungi
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-emerald-100">
                <Button asChild variant="ghost" className="justify-start">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    Log Masuk
                  </Link>
                </Button>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 justify-start">
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    Daftar
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
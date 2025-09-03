import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home */}
        <div className="text-center">
          <Button asChild variant="ghost" className="group mb-6">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Laman Utama
            </Link>
          </Button>
        </div>

        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-gray-900">RumahMengaji</span>
              <span className="text-sm text-emerald-600 -mt-1">Management System</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-900">Log Masuk</CardTitle>
            <CardDescription className="text-gray-600">
              Masukkan maklumat akaun anda untuk mengakses sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Alamat E-mel</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@email.com"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Kata Laluan</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata laluan"
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Peranan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih peranan anda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
                    <SelectItem value="pengurus_pusat">Pengurus Pusat</SelectItem>
                    <SelectItem value="pengajar_pusat">Pengajar Pusat</SelectItem>
                    <SelectItem value="pelajar">Pelajar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link to="/forgot-password" className="text-emerald-600 hover:text-emerald-700">
                  Lupa kata laluan?
                </Link>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                Log Masuk
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              Belum ada akaun?{' '}
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Daftar sekarang
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} RumahMengaji Management System. Hak cipta terpelihara.
        </div>
      </div>
    </div>
  );
}
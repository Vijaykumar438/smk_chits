"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SMKLogo } from "@/components/smk-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const [email, setEmail] = useState("admin@smkchits.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // If already authenticated, redirect to dashboard
  if (!authLoading && user) {
    router.push("/en/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/en/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smk-cream">
        <div className="flex flex-col items-center gap-4">
          <SMKLogo size={80} showText={false} />
          <Loader2 className="h-6 w-6 animate-spin text-smk-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-smk-green-dark via-smk-green to-smk-green-light p-4">
      <Card className="w-full max-w-md shadow-2xl border-smk-gold/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <SMKLogo size={100} showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold text-smk-green">
            SMK CHITS
          </CardTitle>
          <p className="text-sm text-smk-gold font-medium">ఎస్ఎంకె చిట్స్</p>
          <CardDescription className="mt-2">
            Sign in to manage your chit funds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@smkchits.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-smk-gold/30 focus-visible:ring-smk-gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-smk-gold/30 focus-visible:ring-smk-gold"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-smk-green hover:bg-smk-green-light text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t border-smk-gold/10 text-center">
            <p className="text-xs text-muted-foreground">
              Seethala Murali Krishna — Chit Fund Management Suite
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

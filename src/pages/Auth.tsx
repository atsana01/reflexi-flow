import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { el } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Μη έγκυρη διεύθυνση email').max(255, 'Το email πρέπει να είναι έως 255 χαρακτήρες'),
  password: z.string().min(6, 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες'),
});

const signupSchema = z.object({
  email: z.string().trim().email('Μη έγκυρη διεύθυνση email').max(255, 'Το email πρέπει να είναι έως 255 χαρακτήρες'),
  password: z.string()
    .min(10, 'Ο κωδικός πρέπει να έχει τουλάχιστον 10 χαρακτήρες')
    .regex(/[A-Z]/, 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα')
    .regex(/[a-z]/, 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα πεζό γράμμα')
    .regex(/[0-9]/, 'Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν αριθμό')
    .regex(/[^A-Za-z0-9]/, 'Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν ειδικό χαρακτήρα'),
  fullName: z.string().trim().min(1, 'Το πλήρες όνομα είναι υποχρεωτικό').max(100, 'Το όνομα πρέπει να είναι έως 100 χαρακτήρες'),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input with Zod
    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, fullName });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Σφάλμα επικύρωσης",
          description: error.errors[0].message,
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Επιτυχής σύνδεση!" });
      } else {
        // Check if email is allowed before attempting signup
        const { data: isAllowed } = await supabase
          .rpc('is_email_allowed', { check_email: email });
        
        if (!isAllowed) {
          toast({
            variant: "destructive",
            title: "Μη εξουσιοδοτημένο email",
            description: "Η εγγραφή είναι διαθέσιμη μόνο για εξουσιοδοτημένους χρήστες.",
          });
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        toast({
          title: "Λογαριασμός δημιουργήθηκε!",
          description: "Ελέγξτε το email σας για επιβεβαίωση.",
        });
      }
    } catch (error: any) {
      // User-friendly error messages in Greek
      let errorMessage = "Παρακαλώ δοκιμάστε ξανά.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Λάθος email ή κωδικός πρόσβασης.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Παρακαλώ επιβεβαιώστε το email σας πρώτα.";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "Το email είναι ήδη εγγεγραμμένο.";
      } else if (error.message?.includes("εξουσιοδοτημένους")) {
        errorMessage = "Η εγγραφή είναι διαθέσιμη μόνο για εξουσιοδοτημένους χρήστες.";
      }

      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{el.app.title}</CardTitle>
          <CardDescription>
            {isLogin ? el.auth.loginTitle : el.auth.signupTitle}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{el.auth.fullName}</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{el.auth.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{el.auth.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isLogin ? 6 : 10}
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  Ο κωδικός πρέπει να έχει τουλάχιστον 10 χαρακτήρες, κεφαλαία, πεζά, αριθμό και ειδικό χαρακτήρα.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? el.common.loading
                : isLogin
                ? el.auth.loginButton
                : el.auth.signupButton}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? el.auth.noAccount : el.auth.haveAccount}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

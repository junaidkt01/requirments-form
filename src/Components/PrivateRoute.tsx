// src/components/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged, auth } from "../firebase";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const [loading, setLoading] = React.useState(true);
  const [isAuth, setIsAuth] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        setIsAuth(true);
      } else {
        setIsAuth(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>; // optional loading state

  if (!isAuth) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const getErrorMessage = () => {
    if (message) return decodeURIComponent(message);
    
    switch (error) {
      case "AccessDenied":
        return "Access was denied. You may have cancelled the login or denied permissions.";
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      default:
        return "An error occurred during authentication. Please try again.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription className="text-base mt-2">
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error === "AccessDenied" && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="font-medium mb-2">To sign in, you need to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Allow access to your email address</li>
                <li>Allow access to your profile information</li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={() => router.push("/")}
            className="flex-1"
            variant="default"
          >
            Try Again
          </Button>
          <Button
            onClick={() => router.push("/")}
            className="flex-1"
            variant="outline"
          >
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}

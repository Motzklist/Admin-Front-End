import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Motzklist Admin",
  description: "Sign in to the Motzklist Admin Panel",
};

export default function SignIn() {
  return <SignInForm />;
}

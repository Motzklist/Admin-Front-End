import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Motzklist Admin",
  description: "Sign up for the Motzklist Admin Panel",
};

export default function SignUp() {
  return <SignUpForm />;
}

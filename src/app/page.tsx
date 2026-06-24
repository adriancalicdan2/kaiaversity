import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage, { metadata } from "./(marketing)/page";

export { metadata };

export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}

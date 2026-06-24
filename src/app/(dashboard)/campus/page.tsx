import { redirect } from "next/navigation";

// Root "/" redirects to marketing landing
export default function RootPage() {
  redirect("/campus/courses");
}

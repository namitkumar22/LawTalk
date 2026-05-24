import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LawyerProvider } from "@/context/LawyerContext";
import { AdminProvider } from "@/context/AdminContext";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata = {
  title: "LawTalk — Legal Help, Just a Chat Away",
  description:
    "Connect with verified lawyers in India for just ₹2 for your first consultation. Expert legal advice on family law, criminal law, property law, corporate law and more. Authenticate professionals, real-time chat.",
  keywords: [
    "online legal advice india",
    "chat with lawyer",
    "affordable lawyer india",
    "legal consultation",
    "LawTalk",
    "talk to lawyer online",
  ],
  openGraph: {
    title: "LawTalk — Legal Help, Just a Chat Away",
    description: "India's trusted platform to connect with verified lawyers starting at ₹2.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AdminProvider>
          <AuthProvider>
            <LawyerProvider>
              {children}
            </LawyerProvider>
          </AuthProvider>
        </AdminProvider>
      </body>
    </html>
  );
}

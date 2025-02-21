
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "globalStyles/globals.css";




import { PageWrapper, } from "./style";
import Navbar from "components/navbar/navbar";



const poppins = Poppins({ weight: "400", style: "normal", subsets: ["latin"] });
// trigger rebuild


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  

  return (
    <html lang="en">
      <body style={{overflowX: "hidden"}}>
      <Navbar/>{children}
      </body>
    </html>
  );
}


        


import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "globalStyles/globals.css";




import { PageWrapper, NavWrapper } from "./style";
import Navbar from "components/navbar/navbar";
import Sidebar from "components/sidebar/sidebar"


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
        <PageWrapper>
         
      <Navbar/>
      <Sidebar/>
      
      
      
      {children}
      </PageWrapper>
      </body>
    </html>
  );
}


        

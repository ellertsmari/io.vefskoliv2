import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "globalStyles/globals.css";
import  Vector46  from "assets/Vector 46.png";
import efskólinn from "assets/efskólinn.png";


const poppins = Poppins({ weight: "400", style: "normal", subsets: ["latin"] });
// trigger rebuild
export const metadata: Metadata = {
  title: "Vefskólinn LMS",
  description:
    "This is a page for students of Vefskólinn to learn web development.",
};



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  

  return (
    <html lang="en">
      <body>
        <img src={logo.src}></img> 
        
      </body>
    </html>
  );
}

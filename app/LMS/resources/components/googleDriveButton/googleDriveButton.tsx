"use client"
import { Button } from "globalStyles/buttons/default/style";
import { UnstyledLink } from "globalStyles/globalStyles";

const GoogleDriveButton = () => {
    return ( 
        <div>
       <Button $styletype="default">
         <UnstyledLink
           target="_blank"
           href="https://drive.google.com/drive/u/0/folders/1K_LkWMBJFdKyVAOfYJuW1rxUcMzoPeAu"
           style={{color: "white"}}
         >
           Google Drive
         </UnstyledLink>
       </Button>
     </div>
     );
}
 
export default GoogleDriveButton;
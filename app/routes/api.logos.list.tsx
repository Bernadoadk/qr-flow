import { json, type LoaderFunctionArgs } from "@remix-run/node";
import * as fs from "fs";
import * as path from "path";

// GET - Récupérer la liste de tous les logos disponibles
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Chemin vers le dossier des logos dans public
    const logosDir = path.join(process.cwd(), "public", "images", "logos");
    
    // Vérifier que le dossier existe
    if (!fs.existsSync(logosDir)) {
      return json({ logos: [] });
    }

    // Lire tous les fichiers du dossier
    const files = fs.readdirSync(logosDir);
    
    // Filtrer uniquement les fichiers PNG (insensible à la casse)
    const pngFiles = files.filter(file => 
      file.toLowerCase().endsWith('.png')
    ).map(file => `/images/logos/${file}`);

    // Trier par nom
    pngFiles.sort();

    return json({ logos: pngFiles });
  } catch (error) {
    console.error("Error reading logos directory:", error);
    return json({ error: "Failed to list logos", logos: [] }, { status: 500 });
  }
}


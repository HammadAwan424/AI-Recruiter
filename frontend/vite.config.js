import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  vercel: {
    rewrites: [
      {
        source: "/((?!assets/|.*\\.(?:js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|html)).*)",
        destination: "/index.html",
      },
    ],
  },
});

import "./globals.css";
export const metadata = {
    title: "TINT | Traditional medicine knowledge",
    description: "Search reviewed AYUSH and traditional medicine knowledge.",
};
export default function RootLayout({ children }) {
    return (<html lang="en">
      <body>{children}</body>
    </html>);
}

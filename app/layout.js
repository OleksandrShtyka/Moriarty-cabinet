import "./globals.css";

export const metadata = {
  title: "Moriarty | Семейный Кабинет GTA5RP",
  description: "Личный кабинет великой семьи Moriarty на сервере GTA5RP Murrieta. Статистика, казна, выговоры, рефералы и ИИ помощник Володя.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

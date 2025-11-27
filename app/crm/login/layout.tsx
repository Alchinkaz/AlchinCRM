// Отдельный layout для страницы логина без проверки авторизации
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


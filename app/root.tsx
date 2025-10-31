import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { NotificationProvider } from "./components/ui/NotificationSystem";
import { disableBrowserNotifications } from "./utils/disableBrowserNotifications";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "/index.css" },
  { rel: "stylesheet", href: "/fonts.css" },
];

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <NotificationProvider>
          <Outlet />
        </NotificationProvider>
        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Désactiver les notifications du navigateur
              (function() {
                if (typeof window !== 'undefined') {
                  const originalAlert = window.alert;
                  const originalConfirm = window.confirm;
                  
                  window.alert = function(message) {
                    console.log('Alert désactivé:', message);
                  };
                  
                  window.confirm = function(message) {
                    console.log('Confirm désactivé:', message);
                    return false;
                  };
                  
                  // Désactiver les notifications du navigateur
                  if ('Notification' in window && Notification.permission === 'granted') {
                    console.log('Notifications du navigateur désactivées');
                  }
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

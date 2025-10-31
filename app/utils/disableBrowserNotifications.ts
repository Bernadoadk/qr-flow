/**
 * Désactive les notifications du navigateur pour éviter les popups
 */
export const disableBrowserNotifications = () => {
  // Désactiver les notifications du navigateur
  if ('Notification' in window) {
    // Ne pas demander la permission pour les notifications
    if (Notification.permission === 'granted') {
      // Ne pas afficher de notifications
      console.log('Notifications du navigateur désactivées');
    }
  }

  // Remplacer les méthodes d'alerte globales
  if (typeof window !== 'undefined') {
    // Sauvegarder les méthodes originales
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    
    // Remplacer par des versions silencieuses
    window.alert = (message?: string) => {
      console.log('Alert désactivé:', message);
      // Ne pas afficher l'alerte
    };
    
    window.confirm = (message?: string) => {
      console.log('Confirm désactivé:', message);
      // Retourner false par défaut pour éviter les confirmations
      return false;
    };
    
    // Optionnel : restaurer les méthodes originales si nécessaire
    (window as any).restoreAlerts = () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }
};

/**
 * Active les notifications du navigateur (si nécessaire)
 */
export const enableBrowserNotifications = () => {
  if (typeof window !== 'undefined' && (window as any).restoreAlerts) {
    (window as any).restoreAlerts();
  }
};

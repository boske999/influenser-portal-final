'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoadingTimeoutProps {
  isLoading: boolean;
  timeoutDuration?: number; // u milisekundama, default 3000ms (3 sekundi)
}

/**
 * Komponenta koja automatski osvežava stranicu ako učitavanje traje duže od zadatog vremena
 */
export default function LoadingTimeout({ 
  isLoading, 
  timeoutDuration = 3000 
}: LoadingTimeoutProps) {
  const router = useRouter();
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined = undefined;
    
    // Kada počne učitavanje, postavi timeout
    if (isLoading && !timeoutTriggered) {
      timeoutId = setTimeout(() => {
        console.log('Učitavanje traje predugo, osvežavam stranicu...');
        setTimeoutTriggered(true);
        
        // Osvežavanje stranice
        window.location.reload();
      }, timeoutDuration);
    }
    
    // Ako se učitavanje završi pre isteka timeouta, očisti timeout
    if (!isLoading && !timeoutTriggered) {
      if (timeoutId) clearTimeout(timeoutId);
    }
    
    // Čišćenje pri unmountingu komponente
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, timeoutTriggered, timeoutDuration, router]);
  
  // Komponenta ne renderuje ništa vidljivo
  return null;
} 
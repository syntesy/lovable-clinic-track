import { useEffect, useRef } from "react";

/**
 * Hook que encapsula setInterval com cleanup automático.
 * O intervalo só é criado quando `delay` é não-nulo.
 * Usar `delay: null` para pausar o intervalo sem desmontar o componente.
 *
 * @example
 * // Polling a cada 2s enquanto o job estiver ativo
 * useInterval(() => {
 *   fetchJobStatus();
 * }, isJobActive ? 2000 : null);
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Mantém referência à última versão do callback sem recriar o intervalo
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

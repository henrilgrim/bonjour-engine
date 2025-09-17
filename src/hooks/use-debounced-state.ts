import { useState, useEffect, useRef } from 'react';

/**
 * Hook que debounce atualizações de estado para reduzir re-renderizações
 */
export function useDebouncedState<T>(
    initialValue: T,
    delay: number = 100
): [T, (value: T) => void, T] {
    const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
    const [immediateValue, setImmediateValue] = useState<T>(initialValue);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const setValue = (value: T) => {
        setImmediateValue(value);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return [debouncedValue, setValue, immediateValue];
}

/**
 * Hook que debounce apenas a atualização de um valor específico
 */
export function useDebounce<T>(value: T, delay: number = 100): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook para batching de atualizações (agrupa múltiplas atualizações em uma)
 */
export function useBatchedUpdates<T>(
    initialValue: T,
    batchDelay: number = 50
): [T, (updater: (prev: T) => T) => void] {
    const [value, setValue] = useState<T>(initialValue);
    const pendingUpdatesRef = useRef<((prev: T) => T)[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const batchUpdate = (updater: (prev: T) => T) => {
        pendingUpdatesRef.current.push(updater);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setValue(currentValue => {
                let newValue = currentValue;
                for (const updater of pendingUpdatesRef.current) {
                    newValue = updater(newValue);
                }
                pendingUpdatesRef.current = [];
                return newValue;
            });
        }, batchDelay);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return [value, batchUpdate];
}
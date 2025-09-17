import { Unsubscribe } from "firebase/auth";

type ListenerKey = string;
type ListenerCallback<T = any> = (data: T) => void;
type ErrorCallback = (error: unknown) => void;

interface PooledListener {
    key: string;
    unsubscribe: Unsubscribe;
    callbacks: Set<ListenerCallback>;
    errorCallbacks: Set<ErrorCallback>;
    data?: any;
    lastUpdate: number;
    debounceTimeout?: NodeJS.Timeout;
}

class FirebaseListenersPool {
    private listeners = new Map<ListenerKey, PooledListener>();
    private debounceDelay = 100; // 100ms debounce

    /**
     * Adiciona um callback a um listener existente ou cria um novo
     */
    addListener<T>(
        key: ListenerKey,
        createListenerFn: () => Unsubscribe,
        callback: ListenerCallback<T>,
        errorCallback?: ErrorCallback
    ): () => void {
        let pooledListener = this.listeners.get(key);

        if (!pooledListener) {
            // Criar novo listener
            pooledListener = {
                key,
                unsubscribe: createListenerFn(),
                callbacks: new Set(),
                errorCallbacks: new Set(),
                lastUpdate: 0,
            };
            this.listeners.set(key, pooledListener);
        }

        // Adicionar callbacks
        pooledListener.callbacks.add(callback);
        if (errorCallback) {
            pooledListener.errorCallbacks.add(errorCallback);
        }

        // Se já temos dados, enviar imediatamente
        if (pooledListener.data !== undefined) {
            callback(pooledListener.data);
        }

        // Retornar função de cleanup
        return () => this.removeCallback(key, callback, errorCallback);
    }

    /**
     * Remove um callback específico de um listener
     */
    private removeCallback(
        key: ListenerKey,
        callback: ListenerCallback,
        errorCallback?: ErrorCallback
    ) {
        const pooledListener = this.listeners.get(key);
        if (!pooledListener) return;

        pooledListener.callbacks.delete(callback);
        if (errorCallback) {
            pooledListener.errorCallbacks.delete(errorCallback);
        }

        // Se não há mais callbacks, remover o listener
        if (pooledListener.callbacks.size === 0) {
            if (pooledListener.debounceTimeout) {
                clearTimeout(pooledListener.debounceTimeout);
            }
            pooledListener.unsubscribe();
            this.listeners.delete(key);
        }
    }

    /**
     * Atualiza dados de um listener com debounce
     */
    updateData<T>(key: ListenerKey, data: T, force = false) {
        const pooledListener = this.listeners.get(key);
        if (!pooledListener) return;

        pooledListener.data = data;
        pooledListener.lastUpdate = Date.now();

        if (force) {
            this.broadcastUpdate(pooledListener);
            return;
        }

        // Debounce updates
        if (pooledListener.debounceTimeout) {
            clearTimeout(pooledListener.debounceTimeout);
        }

        pooledListener.debounceTimeout = setTimeout(() => {
            this.broadcastUpdate(pooledListener);
        }, this.debounceDelay);
    }

    /**
     * Envia erro para callbacks de erro
     */
    broadcastError(key: ListenerKey, error: unknown) {
        const pooledListener = this.listeners.get(key);
        if (!pooledListener) return;

        pooledListener.errorCallbacks.forEach(callback => {
            try {
                callback(error);
            } catch (e) {
                console.error("Erro no callback de erro:", e);
            }
        });
    }

    /**
     * Envia dados para todos os callbacks
     */
    private broadcastUpdate(pooledListener: PooledListener) {
        pooledListener.callbacks.forEach(callback => {
            try {
                callback(pooledListener.data);
            } catch (error) {
                console.error("Erro no callback do listener:", error);
            }
        });
    }

    /**
     * Remove todos os listeners
     */
    clearAll() {
        for (const [key, pooledListener] of this.listeners) {
            if (pooledListener.debounceTimeout) {
                clearTimeout(pooledListener.debounceTimeout);
            }
            try {
                pooledListener.unsubscribe();
            } catch (error) {
                console.error(`Erro ao remover listener ${key}:`, error);
            }
        }
        this.listeners.clear();
    }

    /**
     * Obtém estatísticas do pool
     */
    getStats() {
        return {
            totalListeners: this.listeners.size,
            listeners: Array.from(this.listeners.entries()).map(([key, listener]) => ({
                key,
                callbackCount: listener.callbacks.size,
                lastUpdate: listener.lastUpdate,
                hasData: listener.data !== undefined,
            })),
        };
    }

    /**
     * Define delay do debounce
     */
    setDebounceDelay(delay: number) {
        this.debounceDelay = Math.max(50, Math.min(delay, 1000)); // Entre 50ms e 1s
    }
}

// Instância singleton
export const firebaseListenersPool = new FirebaseListenersPool();

// Função helper para criar chaves únicas
export function createListenerKey(type: string, ...params: (string | number)[]): string {
    return `${type}:${params.join(':')}`;
}
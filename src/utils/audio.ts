/**
 * Executa um som de alerta simples usando o arquivo de som local.
 * Função mantida para compatibilidade com código legado.
 *
 * @export
 * @param {(AudioContext | null)} audioContext - Parâmetro ignorado (mantido para compatibilidade)
 */
export function playAlertSound(audioContext?: AudioContext | null) {
    // Importa e usa o novo sistema de som
    import("@/lib/sfx/alerts")
        .then(({ playAlert }) => {
            playAlert("soft", { volume: 0.2 });
        })
        .catch((error) => {
            console.error("Erro ao importar sistema de som:", error);
        });
}

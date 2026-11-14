import { onBeforeUnmount, watch } from 'vue'
import { useForm } from 'vee-validate'

const ESPERA_DA_BUSCA = 400

// Cria o formulário do componente: o campo se chama "busca" e o componente não pode ter outro useForm.
export function useBuscaComEspera(buscaAtual: () => string, gravar: (busca: string) => void) {
  const { values, setFieldValue } = useForm({ initialValues: { busca: buscaAtual() } })
  let espera: ReturnType<typeof setTimeout> | undefined

  function buscar() {
    clearTimeout(espera)
    const busca = (values.busca ?? '').trim()
    if (busca === buscaAtual()) return
    gravar(busca)
  }

  watch(
    () => values.busca,
    () => {
      clearTimeout(espera)
      espera = setTimeout(buscar, ESPERA_DA_BUSCA)
    },
  )

  watch(buscaAtual, (busca) => {
    if ((values.busca ?? '').trim() !== busca) setFieldValue('busca', busca)
  })

  onBeforeUnmount(() => clearTimeout(espera))

  return { buscar }
}

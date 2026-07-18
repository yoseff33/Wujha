import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

export function useSupabaseQuery(table: string) {
  const data = ref<any[]>([])
  const loading = ref(false)
  const error = ref(null)

  async function load() {
    loading.value = true
    const { data: d, error: e } = await supabase.from(table).select('*')
    if (e) error.value = e
    data.value = d || []
    loading.value = false
  }

  onMounted(load)

  return { data, loading, error, reload: load }
}

export interface PackingItem {
  id: string
  name: string
  qty?: number | null
  note?: string | null
  checked: boolean
}

export interface PackingCategory {
  title: string
  items: PackingItem[]
}

export interface PackingList {
  categories: PackingCategory[]
  reasoning: string
  generatedAt: number
}

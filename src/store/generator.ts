import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BatchItem } from '@/components/BatchUpload'

export interface BatchResultItem {
  id: string
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: string
  error?: string
  progress?: number
}

export interface GeneratorState {
  // API配置
  apiKey: string
  apiUrl: string
  
  // 输入状态
  image: File | string | null
  productInfo: string // 单个模式的产品信息
  batchItems: BatchItem[] // 批量模式的项目列表
  model: string
  prompt: string
  isBatchMode: boolean
  
  // 结果状态
  result: string | null
  batchResults: BatchResultItem[]
  isLoading: boolean
  isBatchProcessing: boolean
  
  // 历史记录
  history: Array<{
    id: string
    timestamp: number
    productInfo: string
    model: string
    prompt: string
    result: string
  }>
  
  // Actions
  setApiKey: (key: string) => void
  setApiUrl: (url: string) => void
  setImage: (image: File | string | null) => void
  setProductInfo: (info: string) => void
  setBatchItems: (items: BatchItem[]) => void
  setModel: (model: string) => void
  setPrompt: (prompt: string) => void
  setBatchMode: (mode: boolean) => void
  setResult: (result: string | null) => void
  setBatchResults: (results: BatchResultItem[]) => void
  setLoading: (loading: boolean) => void
  setBatchProcessing: (processing: boolean) => void
  updateBatchResult: (id: string, updates: Partial<BatchResultItem>) => void
  addToHistory: (entry: Omit<GeneratorState['history'][0], 'id' | 'timestamp'>) => void
  clearHistory: () => void
  reset: () => void
  resetBatch: () => void
}

// 客户端安全的ID生成器
let historyIdCounter = 0
const generateHistoryId = () => {
  historyIdCounter += 1
  return `history-${historyIdCounter}-${Math.random().toString(36).substr(2, 9)}`
}

// 客户端安全的时间戳生成器
const generateTimestamp = () => {
  if (typeof window !== 'undefined') {
    return Date.now()
  }
  return 0 // 服务端返回固定值
}

export const useGeneratorStore = create<GeneratorState>()(
  persist(
    (set, get) => ({
      // 初始状态
      apiKey: '',
      apiUrl: 'https://api.aihubmix.com/v1',
      image: null,
      productInfo: '',
      batchItems: [],
      model: 'gpt-4o-mini', // 默认使用GPT-4o Mini
      prompt: '请为这张图片生成一个简洁明了的描述，突出其主要特点和要素。',
      isBatchMode: false,
      result: null,
      batchResults: [],
      isLoading: false,
      isBatchProcessing: false,
      history: [],
      
      // Actions
      setApiKey: (apiKey) => set({ apiKey }),
      
      setApiUrl: (apiUrl) => set({ apiUrl }),
      
      setImage: (image) => set({ image }),
      
      setProductInfo: (productInfo) => set({ productInfo }),
      
      setBatchItems: (batchItems) => set({ batchItems }),
      
      setModel: (model) => set({ model }),
      
      setPrompt: (prompt) => set({ prompt }),
      
      setBatchMode: (isBatchMode) => set({ isBatchMode }),
      
      setResult: (result) => set({ result }),
      
      setBatchResults: (batchResults) => set({ batchResults }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setBatchProcessing: (isBatchProcessing) => set({ isBatchProcessing }),
      
      updateBatchResult: (id, updates) => {
        set(state => ({
          batchResults: state.batchResults.map(item =>
            item.id === id ? { ...item, ...updates } : item
          )
        }))
      },
      
      addToHistory: (entry) => {
        const newEntry = {
          ...entry,
          id: generateHistoryId(),
          timestamp: generateTimestamp()
        }
        
        set(state => ({
          history: [newEntry, ...state.history].slice(0, 10) // 只保留最近10条记录
        }))
      },
      
      clearHistory: () => set({ history: [] }),
      
      reset: () => set({
        image: null,
        productInfo: '',
        model: 'gpt-4o-mini',
        prompt: '请为这张图片生成一个简洁明了的描述，突出其主要特点和要素。',
        result: null,
        isLoading: false,
        isBatchMode: false
      }),
      
      resetBatch: () => set({
        batchItems: [],
        batchResults: [],
        isBatchProcessing: false,
        isBatchMode: false
      })
    }),
    {
      name: 'generator-storage',
      skipHydration: true, // 跳过hydration过程，避免服务端客户端状态不一致
      partialize: (state) => ({
        apiKey: state.apiKey,
        apiUrl: state.apiUrl,
        model: state.model,
        prompt: state.prompt,
        history: state.history
      })
    }
  )
) 
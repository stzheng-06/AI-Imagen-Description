'use client'

import { useState, useEffect } from 'react'
import { useGeneratorStore } from '@/store/generator'
import { generateProductDescription, batchGenerateDescriptions } from '@/lib/aihubmix'
import { UploadImage } from '@/components/UploadImage'
import { BatchUpload, type BatchItem } from '@/components/BatchUpload'
import { PromptSelect } from '@/components/PromptSelect'
import { ResultCard } from '@/components/ResultCard'
import { BatchResults } from '@/components/BatchResults'
import { ApiKeySettings } from '@/components/ApiKeySettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { 
	FileImage, 
	Layers, 
	Sparkles, 
	CheckCircle2, 
	AlertTriangle, 
	Settings, 
	Key 
} from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
	const [isClient, setIsClient] = useState(false)
	const [isStoreHydrated, setIsStoreHydrated] = useState(false)

	// 确保客户端渲染和store hydration
	useEffect(() => {
		setIsClient(true)
		// 手动触发Zustand store的hydration
		useGeneratorStore.persist.rehydrate()
		setIsStoreHydrated(true)
	}, [])

	const {
		// API配置
		apiKey,
		apiUrl,
		
		// 输入状态
		image,
		productInfo,
		batchItems,
		model,
		prompt,
		isBatchMode,
		
		// 结果状态
		result,
		batchResults,
		isLoading,
		isBatchProcessing,
		
		// Actions
		setApiKey,
		setApiUrl,
		setImage,
		setProductInfo,
		setBatchItems,
		setModel,
		setPrompt,
		setBatchMode,
		setResult,
		setBatchResults,
		setLoading,
		setBatchProcessing,
		updateBatchResult,
		addToHistory,
		reset,
		resetBatch,
		clearAll
	} = useGeneratorStore()

	const [errors, setErrors] = useState<Record<string, string>>({})

	// 验证输入
	const validateInputs = () => {
		const newErrors: Record<string, string> = {}
		
		if (!apiKey.trim()) {
			newErrors.apiKey = '请配置 API 密钥'
		}
		
		if (!isBatchMode && !image) {
			newErrors.image = '请上传图片或输入图片链接'
		}
		
		if (isBatchMode && batchItems.length === 0) {
			newErrors.batchItems = '请至少添加一个项目'
		}
		
		if (!model) {
			newErrors.model = '请选择 AI 模型'
		}
		
		if (!prompt.trim()) {
			newErrors.prompt = '请输入提示词'
		}
		
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// 生成单个描述
	const handleGenerate = async () => {
		if (!validateInputs()) {
			toast.error('请检查输入信息')
			return
		}

		setLoading(true)
		setResult(null)

		try {
			const response = await generateProductDescription({
				image,
				productInfo: productInfo.trim() || undefined,
				model,
				prompt,
				apiKey,
				apiUrl
			})

			if (response.success) {
				setResult(response.description)
				
				// 添加到历史记录
				addToHistory({
					productInfo: productInfo || '未指定',
					model,
					prompt,
					result: response.description
				})
				
				toast.success('图片描述生成成功')
			} else {
				toast.error(response.error || '生成失败')
		}
		} catch (error) {
			console.error('Generation error:', error)
			toast.error(error instanceof Error ? error.message : '生成失败，请稍后重试')
		} finally {
			setLoading(false)
		}
	}

	// 批量生成描述
	const handleBatchGenerate = async () => {
		if (!validateInputs()) {
			toast.error('请检查输入信息')
			return
		}

		setBatchProcessing(true)
		
		// 客户端安全的ID生成器
		const generateBatchId = (index: number) => {
			if (typeof window !== 'undefined') {
				return `batch-${Date.now()}-${index}`
			}
			return `batch-${Math.random().toString(36).substr(2, 9)}-${index}`
		}
		
		// 初始化批量结果
		const initialResults = batchItems.map((item, index) => ({
			id: generateBatchId(index),
			fileName: item.imageUrl.split('/').pop() || `image-${index + 1}.jpg`,
			status: 'pending' as const,
			progress: 0
		}))
		
		setBatchResults(initialResults)

		try {
			// 转换为旧的批量处理格式
			const images = batchItems.map(item => item.imageUrl)
			
			await batchGenerateDescriptions(
				{
					images,
					model,
					prompt,
					apiKey,
					apiUrl
				},
				(completed, total) => {
					console.log(`Progress: ${completed}/${total}`)
				},
				(index, response, fileName) => {
					const batchItem = batchItems[index]
					const initialResult = initialResults[index]
					if (initialResult) {
						updateBatchResult(initialResult.id, {
							status: response.success ? 'completed' : 'failed',
							result: response.success ? response.description : undefined,
							error: response.success ? undefined : response.error,
							progress: 100
						})
					}
				},
				// 传递每个项目的产品信息
				batchItems.map(item => item.productInfo)
			)
			
			toast.success('批量生成完成')
		} catch (error) {
			console.error('Batch generation error:', error)
			toast.error(error instanceof Error ? error.message : '批量生成失败')
		} finally {
			setBatchProcessing(false)
		}
	}

	// 重新生成（单个）
	const handleRegenerate = () => {
		handleGenerate()
	}

	// 模式切换
	const handleModeChange = (batch: boolean) => {
		setBatchMode(batch)
		if (!batch) {
			resetBatch()
		} else {
			setResult(null)
		}
	}

	// 一键清除所有数据
	const handleClearAll = () => {
		const hasData = result || 
			batchResults.length > 0 || 
			image || 
			productInfo.trim() || 
			batchItems.length > 0

		if (!hasData) {
			toast.info('当前没有需要清除的数据')
			return
		}

		if (window.confirm('确定要清除所有图片描述、批量结果和输入数据吗？此操作不可撤销。')) {
			clearAll()
			toast.success('已清除所有数据，可以开始新的图片描述生成')
		}
	}

	// 检查是否有数据需要清除
	const hasDataToClear = () => {
		return result || 
			batchResults.length > 0 || 
			image || 
			productInfo.trim() || 
			batchItems.length > 0
	}

	// 渲染配置状态
	const renderConfigStatus = () => {
		const modelLabels = {
			'gpt-4o': 'GPT-4o',
			'gpt-4o-mini': 'GPT-4o Mini',
			'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet',
			'claude-3-haiku-20240307': 'Claude 3 Haiku',
			'gemini-1.5-pro': 'Gemini 1.5 Pro',
			'gemini-1.5-flash': 'Gemini 1.5 Flash'
		}
		
		return (
			<div className="flex items-center gap-3">
				<Badge variant="secondary" className="flex items-center gap-1">
					<Sparkles className="h-3 w-3" />
					{modelLabels[model as keyof typeof modelLabels] || model}
				</Badge>
				{apiKey ? (
					<Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
						<CheckCircle2 className="h-3 w-3" />
						API已配置
					</Badge>
				) : (
					<Badge variant="destructive" className="flex items-center gap-1">
						<AlertTriangle className="h-3 w-3" />
						待配置API
					</Badge>
				)}
			</div>
		)
	}

	// 防止hydration mismatch，确保客户端和store都已准备好
	if (!isClient || !isStoreHydrated) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
					<p className="text-gray-600">正在加载应用...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
			<div className="container mx-auto px-4 py-8 max-w-7xl">
				{/* 页面标题 */}
				<div className="text-center mb-8">
					<div className="flex items-center justify-center gap-3 mb-4">
						<div className="p-3 bg-blue-100 rounded-full">
							<FileImage className="h-8 w-8 text-blue-600" />
						</div>
						<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							AI Imagen Description
						</h1>
					</div>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						基于 AIHUBmix 平台的多模态AI模型，为您的图片生成精准、专业的描述内容
					</p>
					<div className="mt-4">
						{renderConfigStatus()}
					</div>
				</div>

				{/* AI配置中心 - 集成API设置、模型选择和提示词 */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-xl">
							<Settings className="h-6 w-6" />
							AI 配置中心
						</CardTitle>
						<p className="text-sm text-gray-600">
							配置您的 AIHUBmix API 密钥、选择合适的AI模型和提示词模板
						</p>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="api" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="api" className="flex items-center gap-2">
									<Key className="h-4 w-4" />
									API 配置
								</TabsTrigger>
								<TabsTrigger value="model" className="flex items-center gap-2">
									<Sparkles className="h-4 w-4" />
									模型 & 提示词
								</TabsTrigger>
							</TabsList>
							
							<TabsContent value="api" className="mt-6">
								<ApiKeySettings
									apiKey={apiKey}
									apiUrl={apiUrl}
									onApiKeyChange={setApiKey}
									onApiUrlChange={setApiUrl}
								/>
							</TabsContent>
							
							<TabsContent value="model" className="mt-6">
								<PromptSelect
									model={model}
									prompt={prompt}
									onModelChange={setModel}
									onPromptChange={setPrompt}
								/>
							</TabsContent>
						</Tabs>
						
						{/* 配置验证错误提示 */}
						{(errors.apiKey || errors.model || errors.prompt) && (
							<Alert className="mt-4">
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>
									请完成配置：{errors.apiKey && 'API密钥 '}{errors.model && 'AI模型 '}{errors.prompt && '提示词'}
								</AlertDescription>
							</Alert>
						)}
					</CardContent>
				</Card>

				{/* 模式选择 */}
				<Card className="mb-8">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Layers className="h-5 w-5" />
								处理模式
							</CardTitle>
							<div className="flex items-center gap-4">
								<Label htmlFor="batch-mode" className="flex items-center gap-2 font-medium">
									<FileImage className="h-4 w-4" />
									单张处理
								</Label>
								<Switch
									id="batch-mode"
									checked={isBatchMode}
									onCheckedChange={handleModeChange}
								/>
								<Label htmlFor="batch-mode" className="flex items-center gap-2 font-medium">
									<Layers className="h-4 w-4" />
									批量处理
								</Label>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-sm text-gray-500">
							{isBatchMode 
								? '批量模式：使用表格形式管理多个图片链接和对应的产品信息，支持CSV导入导出'
								: '单张模式：专注处理单张图片，图片和产品信息一体化输入'
							}
					</div>
					</CardContent>
				</Card>

				{isBatchMode ? (
					/* 批量处理模式 - 垂直布局 */
					<div className="space-y-8">
						{/* 图片批量上传区域 */}
						<BatchUpload
							items={batchItems}
							onItemsChange={setBatchItems}
							maxItems={20}
						/>
						
						{errors.batchItems && (
							<Alert>
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>{errors.batchItems}</AlertDescription>
							</Alert>
						)}

						{/* 生成按钮 */}
						<Card>
							<CardContent className="pt-6">
						<Button 
									onClick={handleBatchGenerate}
									disabled={isBatchProcessing || batchItems.length === 0 || !apiKey}
									className="w-full h-12 text-lg"
									size="lg"
								>
									{isBatchProcessing ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
											批量生成中... ({batchResults.filter(r => r.status === 'completed').length}/{batchItems.length})
										</>
									) : (
										<>
											<Layers className="mr-2 h-5 w-5" />
											开始批量生成 ({batchItems.length} 个项目)
										</>
									)}
						</Button>
						
								{!apiKey && (
									<p className="text-sm text-orange-600 mt-2 text-center">
										请先在配置中心设置 API 密钥
									</p>
								)}
							</CardContent>
						</Card>

						{/* 批量处理结果 */}
						<BatchResults 
							results={batchResults}
							isProcessing={isBatchProcessing}
							getImageUrl={(id) => {
								// 根据结果ID找到对应的批量项目
								const resultIndex = batchResults.findIndex(result => result.id === id)
								if (resultIndex !== -1 && resultIndex < batchItems.length) {
									const batchItem = batchItems[resultIndex]
									return batchItem?.imageUrl || ''
								}
								return ''
							}}
							onRetry={async (id) => {
								// 实现单个重试逻辑
								const itemToRetry = batchResults.find(item => item.id === id)
								if (!itemToRetry) return
								
								updateBatchResult(id, { status: 'processing', progress: 0 })
								
								try {
									const batchIndex = batchResults.findIndex(item => item.id === id)
									const batchItem = batchItems[batchIndex]
									if (!batchItem) {
										toast.error('找不到对应的批量项目')
										return
									}
									
									const response = await generateProductDescription({
										image: batchItem.imageUrl,
										productInfo: batchItem.productInfo.trim() || undefined,
										model,
										prompt,
										apiKey,
										apiUrl
									})
									
									updateBatchResult(id, {
										status: response.success ? 'completed' : 'failed',
										result: response.success ? response.description : undefined,
										error: response.success ? undefined : response.error,
										progress: 100
									})
									
									if (response.success) {
										toast.success(`${itemToRetry.fileName} 重新生成成功`)
									} else {
										toast.error(`${itemToRetry.fileName} 重新生成失败: ${response.error}`)
									}
								} catch (error) {
									updateBatchResult(id, {
										status: 'failed',
										error: error instanceof Error ? error.message : '重新生成失败',
										progress: 100
									})
									toast.error(`${itemToRetry.fileName} 重新生成失败`)
								}
							}}
							onRetryAll={async () => {
								// 实现批量重试逻辑
								const failedItems = batchResults.filter(item => item.status === 'failed')
								if (failedItems.length === 0) return
								
								// 重置失败项目状态
								failedItems.forEach(item => {
									updateBatchResult(item.id, { status: 'processing', progress: 0 })
								})
								
								try {
									for (const failedItem of failedItems) {
										const batchIndex = batchResults.findIndex(item => item.id === failedItem.id)
										const batchItem = batchItems[batchIndex]
										
										if (!batchItem) {
											continue
										}
										
										try {
											const response = await generateProductDescription({
												image: batchItem.imageUrl,
												productInfo: batchItem.productInfo.trim() || undefined,
												model,
												prompt,
												apiKey,
												apiUrl
											})
											
											updateBatchResult(failedItem.id, {
												status: response.success ? 'completed' : 'failed',
												result: response.success ? response.description : undefined,
												error: response.success ? undefined : response.error,
												progress: 100
											})
										} catch (error) {
											updateBatchResult(failedItem.id, {
												status: 'failed',
												error: error instanceof Error ? error.message : '重新生成失败',
												progress: 100
											})
										}
									}
									
									toast.success('批量重试完成')
								} catch (error) {
									toast.error('批量重试失败')
								}
							}}
						/>
					</div>
				) : (
					/* 单张处理模式 - 网格布局 */
					<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
						{/* 左侧输入区 */}
						<div className="xl:col-span-2 space-y-6">
							{/* 图片上传区域 */}
							<UploadImage
								image={image}
								productInfo={productInfo}
								onImageChange={setImage}
								onProductInfoChange={setProductInfo}
							/>
							
							{errors.image && (
								<Alert>
									<AlertTriangle className="h-4 w-4" />
									<AlertDescription>{errors.image}</AlertDescription>
								</Alert>
							)}

							{/* 生成按钮 */}
							<Card>
								<CardContent className="pt-6">
						<Button 
										onClick={handleGenerate}
										disabled={isLoading || !image || !apiKey}
										className="w-full h-12 text-lg"
										size="lg"
									>
										{isLoading ? (
											<>
												<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
												AI 生成中...
											</>
										) : (
											<>
												<Sparkles className="mr-2 h-5 w-5" />
												生成图片描述
											</>
										)}
						</Button>
									
									{!apiKey && (
										<p className="text-sm text-orange-600 mt-2 text-center">
											请先在配置中心设置 API 密钥
										</p>
									)}
								</CardContent>
							</Card>
					</div>
					
						{/* 右侧结果区 */}
						<div className="space-y-6">
							<ResultCard
								result={result}
								isLoading={isLoading}
								onRegenerate={handleRegenerate}
							/>
							
							{/* 使用提示 */}
							<Card>
								<CardHeader>
									<CardTitle className="text-sm">使用说明</CardTitle>
								</CardHeader>
								<CardContent className="text-sm text-gray-600 space-y-2">
									<div className="flex items-start gap-2">
										<span className="font-medium text-blue-600">1.</span>
										<span>在配置中心设置您的 AIHUBmix API 密钥</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="font-medium text-blue-600">2.</span>
										<span>选择合适的 AI 模型和提示词模板</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="font-medium text-blue-600">3.</span>
										<span>选择处理模式：单张图片或批量处理</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="font-medium text-blue-600">4.</span>
										<span>{isBatchMode ? '使用表格添加图片链接和产品信息' : '上传图片并输入产品信息'}</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="font-medium text-blue-600">5.</span>
										<span>点击生成按钮获得专业的图片描述</span>
									</div>
									<Separator className="my-3" />
									<p className="text-xs text-gray-500">
										💡 {isBatchMode ? '批量模式支持CSV导入导出，图片链接和产品信息一一对应' : '单张模式支持本地上传和URL链接，产品信息可选'}
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				)}

				{/* 一键清除功能 */}
				<Card className="mt-8">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Settings className="h-5 w-5" />
							一键清除
						</CardTitle>
						<p className="text-sm text-gray-600">
							清除所有生成的图片描述、历史记录和批量结果，恢复到初始状态
						</p>
					</CardHeader>
					<CardContent>
						<Button
							onClick={handleClearAll}
							disabled={!hasDataToClear()}
							className="w-full h-12 text-lg"
							size="lg"
							variant="destructive"
						>
							{hasDataToClear() ? (
								<>
									<AlertTriangle className="mr-2 h-5 w-5" />
									一键清除
								</>
							) : (
								<>
									<AlertTriangle className="mr-2 h-5 w-5" />
									请先添加数据
								</>
							)}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

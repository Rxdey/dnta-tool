import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Base64ToFilePanel } from './components/Base64ToFilePanel';
import { FileToBase64Panel } from './components/FileToBase64Panel';
import { QRGeneratorPanel } from './components/QRGeneratorPanel';
import { QRParserPanel } from './components/QRParserPanel';

export default function QRTools() {
    const [activeTab, setActiveTab] = useState('generate');

    return (
        <div className="container mx-auto p-4 h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                {/* 整合标题和tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <i className="i-lucide-qr-code text-2xl" />
                        <div>
                            <h1 className="text-xl font-bold">QR 工具箱</h1>
                            <p className="text-xs text-muted-foreground">二维码生成、解析及文件转换</p>
                        </div>
                    </div>

                    <TabsList className="w-full sm:w-auto grid grid-cols-4 gap-4">
                        <TabsTrigger value="generate" className="flex items-center gap-1.5 text-xs">
                            <i className="i-lucide-qr-code text-sm" />
                            <span className="hidden sm:inline">文本转二维码</span>
                            <span className="sm:hidden">生成</span>
                        </TabsTrigger>
                        <TabsTrigger value="parse" className="flex items-center gap-1.5 text-xs">
                            <i className="i-lucide-scan text-sm" />
                            <span className="hidden sm:inline">二维码解析</span>
                            <span className="sm:hidden">解析</span>
                        </TabsTrigger>
                        <TabsTrigger value="file-to-base64" className="flex items-center gap-1.5 text-xs">
                            <i className="i-lucide-file-input text-sm" />
                            <span className="hidden sm:inline">文件→Base64</span>
                            <span className="sm:hidden">→B64</span>
                        </TabsTrigger>
                        <TabsTrigger value="base64-to-file" className="flex items-center gap-1.5 text-xs">
                            <i className="i-lucide-file-output text-sm" />
                            <span className="hidden sm:inline">Base64→文件</span>
                            <span className="sm:hidden">→文件</span>
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="generate" className="mt-0 min-h-0 overflow-hidden">
                    <QRGeneratorPanel />
                </TabsContent>

                <TabsContent value="parse" className="mt-0 min-h-0 overflow-hidden">
                    <QRParserPanel />
                </TabsContent>

                <TabsContent value="file-to-base64" className="mt-0 min-h-0 overflow-hidden ">
                    <FileToBase64Panel />
                </TabsContent>

                <TabsContent value="base64-to-file" className="mt-0 min-h-0 overflow-hidden">
                    <Base64ToFilePanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}

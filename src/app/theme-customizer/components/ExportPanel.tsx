'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { generateMapStyle } from '../utils/mapStyleBuilder';

interface ExportPanelProps {
  theme: string;
  variables: Record<string, string>;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ theme, variables }) => {
  const [activeExport, setActiveExport] = useState<'json' | 'mapstyle' | 'css'>('json');
  const [showCopied, setShowCopied] = useState(false);

  const exportData = useMemo(() => {
    switch (activeExport) {
      case 'json':
        return JSON.stringify({
          themeName: theme,
          timestamp: new Date().toISOString(),
          variables: variables,
          mapStyle: generateMapStyle(variables)
        }, null, 2);
      
      case 'mapstyle':
        return `// Copy this into your getThemeMapStyle function
export const ${theme}MapStyle = ${JSON.stringify(generateMapStyle(variables), null, 2)};`;
      
      case 'css':
        return `.theme-${theme} {
${Object.entries(variables)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join('\n')}
}`;
      
      default:
        return '';
    }
  }, [activeExport, theme, variables]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(exportData);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [exportData]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme}-theme-${activeExport}.${activeExport === 'json' ? 'json' : activeExport === 'css' ? 'css' : 'js'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportData, theme, activeExport]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.variables) {
          Object.entries(data.variables).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value as string);
          });
          
          localStorage.setItem(`theme-custom-${theme}`, JSON.stringify(data.variables));
          window.location.reload();
        }
      } catch (error) {
        alert('Invalid theme file');
      }
    };
    reader.readAsText(file);
  }, [theme]);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-mono uppercase mb-3" style={{ color: 'var(--accent-orange)' }}>
          Export Format
        </h3>
        <div className="flex gap-2">
          {(['json', 'mapstyle', 'css'] as const).map(format => (
            <button
              key={format}
              onClick={() => setActiveExport(format)}
              className={`flex-1 px-3 py-2 font-mono text-xs uppercase border ${
                activeExport === format ? 'border-b-2' : ''
              }`}
              style={{
                backgroundColor: activeExport === format ? 'var(--muted)' : 'transparent',
                borderColor: activeExport === format ? 'var(--primary)' : 'var(--border)',
                color: activeExport === format ? 'var(--primary)' : 'var(--foreground)'
              }}
            >
              {format === 'mapstyle' ? 'Map Style' : format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-mono uppercase mb-3" style={{ color: 'var(--accent-orange)' }}>
          Export Data
        </h3>
        <div className="relative">
          <pre className="p-3 border overflow-x-auto text-xs font-mono" style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
            maxHeight: '300px'
          }}>
            {exportData}
          </pre>
          {showCopied && (
            <div className="absolute top-2 right-2 px-2 py-1 text-xs font-mono" style={{
              backgroundColor: 'var(--success)',
              color: 'var(--background)'
            }}>
              Copied!
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 px-3 py-2 font-mono text-sm border hover:opacity-80"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--background)',
            borderColor: 'var(--primary)'
          }}
        >
          Copy to Clipboard
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 px-3 py-2 font-mono text-sm border hover:opacity-80"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
            borderColor: 'var(--border)'
          }}
        >
          Download File
        </button>
      </div>

      {activeExport === 'json' && (
        <div>
          <h3 className="text-sm font-mono uppercase mb-3" style={{ color: 'var(--accent-orange)' }}>
            Import Theme
          </h3>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="w-full px-3 py-2 font-mono text-sm border"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          />
          <p className="text-xs font-mono mt-2" style={{ color: 'var(--foreground-muted)' }}>
            Import a previously exported theme JSON file
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ExportPanel);
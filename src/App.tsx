import { useRef } from 'react';
import { Layout } from './components/Layout';
import { Toolbar } from './components/Toolbar';
import { ModeToggle } from './components/ModeToggle';
import { PresetSelector } from './components/PresetSelector';
import { ExportButton } from './components/ExportButton';
import { ErrorBanner } from './components/ErrorBanner';
import { SchemaEditor } from './editor/SchemaEditor';
import { DiagramCanvas } from './renderer/DiagramCanvas';
import { useSchema } from './hooks/useSchema';
import { useLayout } from './hooks/useLayout';
import { PRESETS } from './presets';
import { toPng } from 'html-to-image';
import { COLORS } from './renderer/styles';

function App() {
  const { rawText, setRawText, mode, switchMode, parseResult, loadPreset } = useSchema();
  const layout = useLayout(parseResult.schema);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleExport = async () => {
    if (!svgRef.current) return;
    try {
      const dataUrl = await toPng(svgRef.current as unknown as HTMLElement, {
        backgroundColor: COLORS.background,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `schema-sketch-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <Layout
      left={
        <div style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          gap: '12px',
        }}>
          {/* Header */}
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              margin: 0,
            }}>
              SchemaSketch
            </h1>
            <p style={{
              fontSize: '12px',
              color: 'var(--type-text)',
              marginTop: '4px',
            }}>
              Drop your schema. Watch it sketch itself.
            </p>
          </div>

          {/* Toolbar */}
          <Toolbar>
            <ModeToggle mode={mode} onChange={switchMode} />
            <div style={{ flex: 1 }} />
            <PresetSelector presets={PRESETS} onSelect={(p) => loadPreset(p.name)} />
          </Toolbar>

          {/* Editor */}
          <SchemaEditor value={rawText} onChange={setRawText} mode={mode} />

          {/* Errors */}
          <ErrorBanner errors={parseResult.errors} />

          {/* Export button at bottom */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ExportButton onExport={handleExport} />
          </div>
        </div>
      }
      right={
        layout && parseResult.schema ? (
          <DiagramCanvas
            ref={svgRef}
            schema={parseResult.schema}
            layout={layout}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--type-text)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            textAlign: 'center',
            padding: '40px',
          }}>
            {parseResult.errors.length > 0
              ? 'Fix the errors in your schema to see the diagram.'
              : 'Paste a schema to get started.'}
          </div>
        )
      }
    />
  );
}

export default App;

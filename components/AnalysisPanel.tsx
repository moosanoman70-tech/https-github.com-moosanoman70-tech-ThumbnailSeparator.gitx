import React from 'react';
import { CompositionAnalysis } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AnalysisPanelProps {
  analysis: CompositionAnalysis;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  const radarData = [
    { subject: 'Rule of 3rds', A: analysis.ruleOfThirdsScore, fullMark: 100 },
    { subject: 'Balance', A: analysis.visualBalanceScore, fullMark: 100 },
    { subject: 'Contrast', A: analysis.contrastLevel === 'High' ? 90 : analysis.contrastLevel === 'Medium' ? 60 : 30, fullMark: 100 },
    { subject: 'Eye Contact', A: analysis.eyeContact ? 100 : 20, fullMark: 100 },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 custom-scrollbar space-y-8 bg-gray-900">
      
      {/* Suggestions Box */}
      <section className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">✨ AI Suggestions</h3>
        <ul className="space-y-2">
          {analysis.suggestions.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-300">
              <span className="text-brand-400 mt-1">•</span>
              {s}
            </li>
          ))}
        </ul>
      </section>

      {/* Scores */}
      <section>
        <h3 className="text-sm font-uppercase text-gray-500 font-bold tracking-wider mb-4">COMPOSITION METRICS</h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-850 p-4 rounded-lg border border-gray-800 text-center">
                <div className="text-3xl font-bold text-white mb-1">{analysis.ruleOfThirdsScore}</div>
                <div className="text-xs text-gray-500">Rule of Thirds</div>
            </div>
            <div className="bg-gray-850 p-4 rounded-lg border border-gray-800 text-center">
                <div className="text-3xl font-bold text-white mb-1">{analysis.visualBalanceScore}</div>
                <div className="text-xs text-gray-500">Visual Balance</div>
            </div>
        </div>
      </section>

      {/* Radar Chart */}
      <section className="h-64 w-full">
        <h3 className="text-sm font-uppercase text-gray-500 font-bold tracking-wider mb-2">SCORE MAP</h3>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none" />
            <Radar
              name="Score"
              dataKey="A"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </section>

      {/* Color Palette */}
      <section>
        <h3 className="text-sm font-uppercase text-gray-500 font-bold tracking-wider mb-3">DOMINANT PALETTE</h3>
        <div className="flex h-16 rounded-xl overflow-hidden shadow-lg">
          {analysis.dominantColors.map((color, i) => (
            <div 
                key={i} 
                className="flex-1 flex items-end justify-center pb-2 group relative cursor-pointer" 
                style={{ backgroundColor: color }}
                onClick={() => navigator.clipboard.writeText(color)}
            >
                <span className="bg-black/50 text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {color}
                </span>
            </div>
          ))}
        </div>
        <div className="text-xs text-center mt-2 text-gray-500">Click to copy Hex</div>
      </section>

      {/* Metadata dump (hidden by default mostly) */}
      <section className="pt-4 border-t border-gray-800">
        <h3 className="text-xs text-gray-600 mb-2">RAW METADATA</h3>
        <pre className="text-[10px] bg-black p-2 rounded text-green-500 overflow-x-auto">
            {JSON.stringify({ 
                brightness: analysis.brightnessMap,
                contrast: analysis.contrastLevel,
                centerMass: analysis.visualWeightCenter 
            }, null, 2)}
        </pre>
      </section>

    </div>
  );
};

import React from 'react';

type WeeklyReportJSON = {
    summary_message: string;
    strengths: string[];
    areas_for_improvement: string[];
    next_week_strategy: string;
    score_out_of_10: number;
};

interface Props {
    data: WeeklyReportJSON;
}

export function WeeklyReportRenderer({ data }: Props) {
    if (!data?.summary_message) {
        return <p className="text-gray-500">Incomplete report payload.</p>;
    }

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1 bg-purple-50 border border-purple-100 p-4 rounded-lg">
                    <h3 className="text-purple-900 font-semibold mb-2">Weekly Summary</h3>
                    <p className="text-purple-800 text-sm leading-relaxed">{data.summary_message}</p>
                </div>

                {data.score_out_of_10 !== undefined && (
                    <div className={`shrink-0 flex flex-col items-center justify-center p-4 rounded-lg border-2 ${getScoreColor(data.score_out_of_10)} min-w-[100px]`}>
                        <span className="text-xs uppercase font-bold tracking-wider mb-1">Score</span>
                        <div className="text-3xl font-black">
                            {data.score_out_of_10}
                            <span className="text-lg text-opacity-50">/10</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {data.strengths && data.strengths.length > 0 && (
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-emerald-700 flex items-center gap-2 mb-3">
                            <span className="text-xl">💪</span> Strengths
                        </h4>
                        <ul className="space-y-2">
                            {data.strengths.map((item, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-gray-700">
                                    <span className="text-emerald-500">✓</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {data.areas_for_improvement && data.areas_for_improvement.length > 0 && (
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-orange-700 flex items-center gap-2 mb-3">
                            <span className="text-xl">🎯</span> Areas to Improve
                        </h4>
                        <ul className="space-y-2">
                            {data.areas_for_improvement.map((item, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-gray-700">
                                    <span className="text-orange-500">→</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {data.next_week_strategy && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                        <span className="text-xl">📅</span> Next Week's Strategy
                    </h4>
                    <p className="text-blue-800 text-sm leading-relaxed">{data.next_week_strategy}</p>
                </div>
            )}
        </div>
    );
}

const EMOTION_ZONES = [
  { zone: 'Green Zone', color: 'bg-green-400', description: 'Happy, focused, calm', percentage: 0 },
  { zone: 'Yellow Zone', color: 'bg-yellow-400', description: 'Excited, worried, frustrated', percentage: 0 },
  { zone: 'Blue Zone', color: 'bg-blue-300', description: 'Tired, bored, sad', percentage: 0 },
  { zone: 'Red Zone', color: 'bg-red-400', description: 'Overwhelmed, angry, scared', percentage: 0 },
];

const LEARNING_GOALS = [
  { goal: 'Identifying Emotions', icon: '🔍', progress: 0 },
  { goal: 'Self-Regulation', icon: '🧘', progress: 0 },
  { goal: 'Social Connection', icon: '🤝', progress: 0 },
  { goal: 'Coping Strategies', icon: '🛡️', progress: 0 },
  { goal: 'Confidence Building', icon: '⭐', progress: 0 },
  { goal: 'Transition Management', icon: '🔄', progress: 0 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Track emotional learning progress across all episodes.</p>
      </div>

      {/* No data yet banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 flex items-start gap-4">
        <span className="text-2xl">ℹ️</span>
        <div>
          <p className="font-semibold text-blue-800">Start generating episodes to see analytics</p>
          <p className="text-blue-600 text-sm mt-1">
            As your child watches episodes and completes interactive moments, their progress will appear here.
          </p>
        </div>
      </div>

      {/* Zone distribution */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 text-xl mb-5">Zone Distribution</h2>
          <div className="space-y-3">
            {EMOTION_ZONES.map((z) => (
              <div key={z.zone} className="flex items-center gap-3">
                <div className={`w-4 h-4 ${z.color} rounded-full flex-shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{z.zone}</span>
                    <span className="text-sm text-gray-400">{z.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${z.color} h-2 rounded-full transition-all`}
                      style={{ width: `${z.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 text-xl mb-5">Episodes Watched</h2>
          <div className="flex flex-col items-center justify-center h-36 text-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">0</div>
            <p className="text-gray-500 text-sm">Total episodes completed</p>
          </div>
        </div>
      </div>

      {/* Learning goals progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 text-xl mb-5">Learning Goals Progress</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {LEARNING_GOALS.map((g) => (
            <div key={g.goal} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl">{g.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">{g.goal}</span>
                  <span className="text-xs text-gray-400">{g.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

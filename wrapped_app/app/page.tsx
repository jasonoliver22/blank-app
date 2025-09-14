"use client";

import { useState, useRef } from "react";

interface Conversation {
  title: string;
  create_time?: number;
  update_time?: number;
  mapping?: Record<string, any>;
}

interface AnalysisData {
  totalConversations: number;
  firstChat: string;
  lastChat: string;
  avgPerDay: number;
  longestBreak: number;
  avgConversationLength: number;
  peakHour: string;
  weekendCount: number;
  weekdayCount: number;
  politenessScore: number;
  mostActiveDay: string;
  longestConversation: number;
  longestStreak: number;
  themes: string;
}


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseJSONOrZIP = async (file: File): Promise<any> => {
    const fileBytes = await file.arrayBuffer();
    const fileData = new Uint8Array(fileBytes);
    
    // Try to parse as JSON first
    try {
      const text = new TextDecoder().decode(fileData);
      return JSON.parse(text);
    } catch (e) {
      // If not JSON, try as ZIP
      try {
        // For now, we'll just handle JSON files
        // ZIP parsing would require additional libraries
        throw new Error("ZIP files not supported yet. Please upload a JSON file.");
      } catch (zipError) {
        throw new Error("Invalid file format. Please upload a valid JSON file.");
      }
    }
  };

  const extractConversations = (data: any): Conversation[] => {
    if (Array.isArray(data)) {
      return data.filter(item => typeof item === 'object' && item !== null);
    }
    if (data && Array.isArray(data.conversations)) {
      return data.conversations.filter((item: any) => typeof item === 'object' && item !== null);
    }
    return [];
  };

  const filterByYear = (conversations: Conversation[], year: number): Conversation[] => {
    return conversations.filter(conv => {
      const createTime = conv.create_time;
      if (!createTime) return false;
      const convYear = new Date(createTime * 1000).getFullYear();
      return convYear === year;
    });
  };

  const analyzeConversations = (conversations: Conversation[]): AnalysisData => {
    const currentYear = new Date().getFullYear();
    const yearConversations = filterByYear(conversations, currentYear);
    
    if (yearConversations.length === 0) {
      throw new Error(`No conversations found for ${currentYear}`);
    }

    // Extract timestamps
    const timestamps = yearConversations
      .map(conv => conv.create_time)
      .filter((ts): ts is number => ts !== undefined)
      .sort((a, b) => a - b);

    const firstTimestamp = timestamps[0];
    const lastTimestamp = timestamps[timestamps.length - 1];

    // Calculate time span
    const timeSpanDays = (lastTimestamp - firstTimestamp) / (24 * 60 * 60);
    const avgPerDay = yearConversations.length / Math.max(1, timeSpanDays);

    // Calculate longest break
    let longestBreak = 0;
    for (let i = 0; i < timestamps.length - 1; i++) {
      const breakTime = timestamps[i + 1] - timestamps[i];
      longestBreak = Math.max(longestBreak, breakTime);
    }
    const longestBreakDays = longestBreak / (24 * 60 * 60);

    // Calculate average conversation length
    const totalTurns = yearConversations.reduce((sum, conv) => {
      const mapping = conv.mapping || {};
      return sum + Object.keys(mapping).length;
    }, 0);
    const avgConversationLength = totalTurns / yearConversations.length;

    // Find peak hour
    const hours = timestamps.map(ts => new Date(ts * 1000).getHours());
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    const peakHour = Object.entries(hourCounts).reduce((a, b) => hourCounts[Number(a[0])] > hourCounts[Number(b[0])] ? a : b)[0];
    const peakHourNum = Number(peakHour);
    const peakHourFormatted = peakHourNum === 0 ? "12:00 AM" : 
                             peakHourNum < 12 ? `${peakHourNum}:00 AM` :
                             peakHourNum === 12 ? "12:00 PM" : `${peakHourNum - 12}:00 PM`;

    // Weekend vs weekday
    const weekendCount = timestamps.filter(ts => {
      const day = new Date(ts * 1000).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }).length;
    const weekdayCount = timestamps.length - weekendCount;

    // Politeness score (simplified)
    let politeCount = 0;
    let totalMessages = 0;
    yearConversations.forEach(conv => {
      const mapping = conv.mapping || {};
      Object.values(mapping).forEach((node: any) => {
        const message = node?.message;
        if (message?.author?.role === 'user') {
          const content = message.content?.parts || [message.content];
          const text = Array.isArray(content) ? content.join(' ') : content || '';
          totalMessages++;
          if (text.toLowerCase().includes('please') || text.toLowerCase().includes('thank')) {
            politeCount++;
          }
        }
      });
    });
    const politenessScore = totalMessages > 0 ? Math.round(1 + (politeCount / totalMessages) * 4) : 0;

    // Most active day
    const dayCounts = timestamps.reduce((acc, ts) => {
      const date = new Date(ts * 1000).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostActiveDay = Object.entries(dayCounts).reduce((a, b) => dayCounts[a[0]] > dayCounts[b[0]] ? a : b)[0];

    // Longest conversation
    const longestConversation = Math.max(...yearConversations.map(conv => {
      const mapping = conv.mapping || {};
      return Object.keys(mapping).length;
    }));

    // Longest streak (simplified)
    const uniqueDays = [...new Set(timestamps.map(ts => Math.floor(ts / (24 * 60 * 60))))].sort((a, b) => a - b);
    let longestStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      if (uniqueDays[i] === uniqueDays[i - 1] + 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    // Theme analysis (simplified)
    const titles = yearConversations.map(conv => conv.title || '(untitled)').filter(title => title !== '(untitled)');
    const themeKeywords = {
      coding: ['code', 'programming', 'python', 'javascript', 'function', 'debug', 'api', 'database', 'sql', 'html', 'css', 'react', 'node', 'git', 'github'],
      learning: ['learn', 'study', 'tutorial', 'course', 'education', 'explain', 'understand', 'concept', 'theory'],
      writing: ['write', 'essay', 'article', 'blog', 'content', 'story', 'poem', 'creative', 'draft', 'edit'],
      work: ['work', 'job', 'career', 'project', 'meeting', 'presentation', 'report', 'business', 'professional'],
      personal: ['personal', 'life', 'relationship', 'family', 'friend', 'health', 'fitness', 'travel', 'hobby']
    };

    const themeCounts = Object.entries(themeKeywords).map(([theme, keywords]) => {
      const count = titles.filter(title => 
        keywords.some(keyword => title.toLowerCase().includes(keyword))
      ).length;
      return { theme, count };
    }).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

    const themes = themeCounts.length > 0 
      ? `Top themes: ${themeCounts.slice(0, 3).map(t => `${t.theme} (${t.count})`).join(', ')}`
      : 'No clear themes detected';

    return {
      totalConversations: yearConversations.length,
      firstChat: new Date(firstTimestamp * 1000).toLocaleDateString(),
      lastChat: new Date(lastTimestamp * 1000).toLocaleDateString(),
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      longestBreak: Math.round(longestBreakDays * 10) / 10,
      avgConversationLength: Math.round(avgConversationLength * 10) / 10,
      peakHour: peakHourFormatted,
      weekendCount,
      weekdayCount,
      politenessScore,
      mostActiveDay,
      longestConversation,
      longestStreak,
      themes
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    setVideoError(null);

    try {
      const data = await parseJSONOrZIP(selectedFile);
      const conversations = extractConversations(data);
      const analysisData = analyzeConversations(conversations);
      setAnalysis(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    if (!analysis) return;

    setVideoLoading(true);
    setVideoError(null);

    try {
      const response = await fetch('/api/create-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysis),
      });

      const result = await response.json();

      if (result.success) {
        // Use the filename from the response
        setVideoUrl(`/api/video/${result.filename}`);
      } else {
        setVideoError(result.error || 'Failed to generate video');
      }
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
            🎁 ChatWrapped
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Your 2025 Chat Analytics Dashboard
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Upload your chat export file and discover your conversation patterns!
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.zip"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="text-4xl mb-4">📁</div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Upload Your Chat Export
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Supported formats: JSON, ZIP
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Choose File
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Analyzing your chats...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  📊 Your 2025 Chat Stats
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {analysis.totalConversations}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Total Conversations</div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {analysis.avgPerDay}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Avg per Day</div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {analysis.avgConversationLength}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Avg Conversation Length</div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {analysis.politenessScore}/5
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Politeness Score</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  🕐 Your Chat Patterns
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Peak Hour:</span>
                    <span className="font-semibold">{analysis.peakHour}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Weekend Chats:</span>
                    <span className="font-semibold">{analysis.weekendCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Weekday Chats:</span>
                    <span className="font-semibold">{analysis.weekdayCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Longest Break:</span>
                    <span className="font-semibold">{analysis.longestBreak} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Longest Streak:</span>
                    <span className="font-semibold">{analysis.longestStreak} days</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  🎯 Your Chat Themes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{analysis.themes}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  📅 Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">First Chat:</span>
                    <span className="font-semibold">{analysis.firstChat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Chat:</span>
                    <span className="font-semibold">{analysis.lastChat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Most Active Day:</span>
                    <span className="font-semibold">{analysis.mostActiveDay}</span>
                  </div>
                </div>
              </div>

              {/* Video Generation Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  🎬 Generate Your ChatWrapped Video
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create an animated video showcasing your chat statistics!
                </p>
                
                <div className="flex flex-col items-center space-y-4">
                  <button
                    onClick={generateVideo}
                    disabled={videoLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {videoLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Generating Video...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>🎥</span>
                        <span>Generate Video</span>
                      </div>
                    )}
                  </button>

                  {videoError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 w-full">
                      <p className="text-red-600 dark:text-red-400">{videoError}</p>
                    </div>
                  )}

                  {videoUrl && (
                    <div className="w-full space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          ✅ Video generated successfully!
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <video
                          controls
                          className="w-full max-w-2xl mx-auto rounded-lg"
                          poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDBfbGluZWFyXzFfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTkyMCIgeTI9IjEwODAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjMzM2NkY2Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjOTMzM0VBIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+"
                        >
                          <source src={videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        <a
                          href={videoUrl}
                          download="chatwrapped-video.mp4"
                          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          📥 Download Video
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(window.location.origin + videoUrl)}
                          className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          🔗 Copy Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

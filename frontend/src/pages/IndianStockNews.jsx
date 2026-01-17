import React, { useState } from "react";
import { Search, Loader, AlertCircle, Lightbulb, ExternalLink } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";

const IndianStockNews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [articles, setArticles] = useState([]);

  const serverUrl = "http://localhost:8901";

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      toast.warning("Enter a search query");
      return;
    }

    setLoading(true);
    setAiSummary(null);
    setArticles([]);

    try {
      const response = await axios.get(`${serverUrl}/api/ai-news/search`, {
        params: { query: searchQuery },
      });

      if (response.data.success) {
        setAiSummary(response.data.aiSummary);
        setArticles(response.data.sourceArticles || []);
        toast.success("News summarized!");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to fetch news";
      toast.error(msg);
      setAiSummary(null);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-950 text-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold">
            Indian Stock Market
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"> News</span>
          </h1>

          <p className="text-neutral-400 text-lg">
            AI-powered summaries of NSE and BSE stock market news
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search: RELIANCE, NIFTY 50, TCS, NSE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 transition"
            >
              Search
            </button>
          </form>

          {/* Quick Links */}
          <div className="flex justify-center gap-2 flex-wrap">
            {["RELIANCE", "NIFTY 50", "TCS", "HDFC"].map((stock) => (
              <button
                key={stock}
                onClick={() => setSearchQuery(stock)}
                className="text-sm px-3 py-1 rounded-full border border-white/20 hover:border-blue-500 hover:text-blue-400 transition"
              >
                {stock}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Loading */}
          {loading && (
            <div className="text-center py-16">
              <Loader className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
              <p className="text-neutral-400 font-medium">
                Fetching and analyzing news...
              </p>
            </div>
          )}

          {/* Summary */}
          {aiSummary && !loading && (
            <div className="mb-8 rounded-xl border border-blue-500/30 bg-blue-500/5 p-6 backdrop-blur-sm">
              <div className="flex gap-3 mb-4">
                <Lightbulb className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <h2 className="text-xl font-bold">AI Summary</h2>
              </div>
              <div className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm space-y-3">
                {aiSummary}
              </div>
            </div>
          )}

          {/* Articles */}
          {articles.length > 0 && !loading && (
            <div>
              <h3 className="text-lg font-bold mb-4">
                Source Articles ({articles.length})
              </h3>
              <div className="space-y-3">
                {articles.map((article, idx) => (
                  <a
                    key={idx}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-4 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition line-clamp-2">
                        {article.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {article.source}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!aiSummary && !articles.length && !loading && (
            <div className="text-center py-16">
              <AlertCircle className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400 font-medium">
                Search for Indian stock market news
              </p>
              <p className="text-neutral-500 text-sm mt-1">
                Try: RELIANCE, NIFTY 50, NSE market, TCS earnings
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default IndianStockNews;
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = "https://api.tavily.com/search";
const OLLAMA_API = "http://localhost:11434";
const OLLAMA_MODEL = "qwen3-coder:480b-cloud";

// Indian stock market keywords
const INDIAN_STOCK_KEYWORDS = [
  "nse",
  "bse",
  "sensex",
  "nifty",
  "india",
  "stock",
  "market",
  "reliance",
  "tcs",
  "infy",
  "hdfc",
  "icici",
  "sbin",
  "itc",
  "lt",
  "maruti",
  "axis",
  "wipro",
  "bajaj",
  "tatamotors",
  "asianpaint",
  "sunpharma",
  "powergrid",
  "bharti",
  "share",
  "rupee",
  "rbi",
  "sebi",
  "trading",
  "dividend",
];

/**
 * Call Ollama locally for summarization
 */
const callOllama = async (prompt) => {
  try {
    const response = await axios.post(
      `${OLLAMA_API}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.7,
      },
      { timeout: 120000 }
    );
    return response.data?.response?.trim() || "";
  } catch (error) {
    console.error("Ollama error:", error.message);
    throw new Error(`AI Summarization failed: ${error.message}`);
  }
};

/**
 * Check if query is about Indian stock market
 */
const isIndianStockQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  return INDIAN_STOCK_KEYWORDS.some((keyword) => lowerQuery.includes(keyword));
};

/**
 * ✅ SIMPLIFIED: Fetch ONLY Indian stock market news + AI summarize
 */
export const searchAndSummarize = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a search query",
        example: "Try: RELIANCE, NIFTY 50, NSE, TCS, Stock Market India",
      });
    }

    // ✅ CHECK: Only allow Indian stock market queries
    if (!isIndianStockQuery(query)) {
      return res.status(403).json({
        success: false,
        message: "Only Indian stock market news available. Try searching for NSE, BSE, or Indian stocks like RELIANCE, TCS, INFY, etc.",
        example: "Valid searches: 'RELIANCE stock', 'NIFTY 50', 'BSE market', 'TCS news'",
      });
    }

    if (!TAVILY_API_KEY) {
      return res.status(400).json({
        success: false,
        message: "Tavily API key not configured",
      });
    }

    console.log(`🔍 STEP 1: Searching Indian market news for "${query}"`);

    // STEP 1: Fetch news from Tavily with Indian market focus
    const searchResponse = await axios.post(
      TAVILY_API_URL,
      {
        api_key: TAVILY_API_KEY,
        query: `${query} NSE BSE India stock market`,
        include_answer: true,
        max_results: 10,
        search_depth: "advanced",
        topic: "news",
      },
      { timeout: 15000 }
    );

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No Indian stock market news found for "${query}"`,
        query,
      });
    }

    console.log(`✅ STEP 1: Found ${searchResponse.data.results.length} articles`);

    // STEP 2: Format articles
    const articles = searchResponse.data.results.map((result) => ({
      title: result.title,
      source: result.source,
      link: result.url,
      snippet: result.snippet || result.content || "",
      publish_date: result.published_date,
    }));

    console.log(`📝 STEP 2: Formatting articles...`);

    // STEP 3: Prepare content for AI summarization
    const newsContent = articles
      .map(
        (article, idx) =>
          `Article ${idx + 1}: ${article.title}\nSource: ${article.source}\nContent: ${article.snippet}`
      )
      .join("\n\n");

    console.log(`🤖 STEP 3: Sending to AI for summarization...`);

    // STEP 4: Summarize with AI
    const summaryPrompt = `Summarize these Indian stock market news articles about "${query}" in a clear, concise way.

Format:

SUMMARY
Provide a brief 2-3 sentence overview

KEY POINTS
- Point 1
- Point 2
- Point 3

SENTIMENT
Positive, Negative, or Neutral?

---

ARTICLES:
${newsContent}`;

    const aiSummary = await callOllama(summaryPrompt);

    console.log(`✅ STEP 4: AI summary complete`);

    // STEP 5: Return results
    return res.status(200).json({
      success: true,
      message: "Indian stock market news fetched and summarized",
      query,
      aiSummary,
      sourceArticles: articles,
      articleCount: articles.length,
      source: "Tavily + Qwen3",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch news",
      error: error.message,
    });
  }
};

export default {
  searchAndSummarize,
};
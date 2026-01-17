import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = "https://api.tavily.com/search";
const OLLAMA_API = "http://localhost:11434";
const OLLAMA_MODEL = "qwen3-coder:480b-cloud";

// STRICT: Only valid Indian stock market queries
const VALID_INDIAN_STOCKS = [
  "reliance",
  "tcs",
  "infy",
  "hdfc",
  "hdfc bank",
  "icici bank",
  "sbin",
  "itc",
  "lt",
  "maruti",
  "axis bank",
  "wipro",
  "bajaj auto",
  "sunpharma",
  "powergrid",
  "bharti airtel",
  "m&m",
  "asianpaint",
  "bajajfinsv",
  "tatamotors",
  "nifty 50",
  "nifty",
  "sensex",
  "nse",
  "bse",
];

const ALLOWED_KEYWORDS = [
  "stock",
  "market",
  "share",
  "trading",
  "dividend",
  "ipo",
  "listing",
  "earnings",
  "results",
  "rbi",
  "sebi",
  "rupee",
  "india",
  "bull",
  "bear",
  "nifty",
  "sensex",
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
    throw new Error(`AI failed: ${error.message}`);
  }
};

/**
 * ✅ STRICT CHECK: Only allow valid Indian stock market queries
 */
const isValidIndianStockQuery = (query) => {
  const lowerQuery = query.toLowerCase();

  // Check if contains valid stock name
  const hasValidStock = VALID_INDIAN_STOCKS.some((stock) =>
    lowerQuery.includes(stock)
  );

  // Check if contains market-related keywords
  const hasMarketKeyword = ALLOWED_KEYWORDS.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  // Check for India/NSE/BSE
  const hasMarketLocation =
    lowerQuery.includes("india") ||
    lowerQuery.includes("nse") ||
    lowerQuery.includes("bse");

  // STRICT: Must have valid stock OR (market keyword + location)
  if (hasValidStock) return true;
  if (hasMarketKeyword && hasMarketLocation) return true;

  return false;
};

/**
 * ✅ STRICT: Fetch ONLY Indian stock market news + AI summarize
 */
export const searchAndSummarize = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a search query",
        validSearches: [
          "RELIANCE",
          "NIFTY 50",
          "NSE market",
          "TCS stock",
          "HDFC bank",
        ],
      });
    }

    // ✅ STRICT CHECK: Only allow Indian stock market queries
    if (!isValidIndianStockQuery(query)) {
      return res.status(403).json({
        success: false,
        message:
          "Only Indian stock market news available. Search for NSE, BSE, or Indian stocks.",
        validStocks: VALID_INDIAN_STOCKS.slice(0, 10),
        validExample: [
          "RELIANCE stock",
          "NIFTY 50",
          "TCS earnings",
          "NSE market news",
        ],
      });
    }

    if (!TAVILY_API_KEY) {
      return res.status(400).json({
        success: false,
        message: "API key not configured",
      });
    }

    console.log(
      `🔍 STEP 1: Fetching Indian stock news for: "${query}"`
    );

    // STEP 1: Fetch news from Tavily
    const searchResponse = await axios.post(
      TAVILY_API_URL,
      {
        api_key: TAVILY_API_KEY,
        query: `${query} NSE BSE India stock market news`,
        include_answer: true,
        max_results: 12,
        search_depth: "advanced",
        topic: "news",
      },
      { timeout: 15000 }
    );

    if (
      !searchResponse.data.results ||
      searchResponse.data.results.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: `No Indian stock market news found for "${query}"`,
        query,
      });
    }

    console.log(
      `✅ STEP 1: Found ${searchResponse.data.results.length} articles`
    );

    // STEP 2: Format articles
    const articles = searchResponse.data.results.map((result) => ({
      title: result.title,
      source: result.source,
      link: result.url,
      snippet: result.snippet || result.content || "",
      publish_date: result.published_date,
    }));

    console.log(`📝 STEP 2: Preparing AI summarization...`);

    // STEP 3: Prepare content for AI
    const newsContent = articles
      .map(
        (article, idx) =>
          `Article ${idx + 1}: ${article.title}\nSource: ${article.source}\nContent: ${article.snippet}`
      )
      .join("\n\n");

    console.log(`🤖 STEP 3: AI summarizing...`);

    // STEP 4: Summarize with AI
    const summaryPrompt = `You are an Indian stock market analyst. Summarize these news articles about "${query}" for Indian investors.

Format your response exactly as:

SUMMARY
Write 2-3 sentences summarizing the key news

KEY POINTS
- Point 1
- Point 2
- Point 3

MARKET SENTIMENT
Is this Positive, Negative, or Neutral for investors? Why?

INVESTMENT IMPLICATION
What should Indian investors know?

---

NEWS ARTICLES:
${newsContent}`;

    const aiSummary = await callOllama(summaryPrompt);

    console.log(`✅ STEP 4: Summarization complete`);

    // STEP 5: Return results
    return res.status(200).json({
      success: true,
      message: "Indian stock market news fetched and summarized",
      query,
      aiSummary,
      sourceArticles: articles,
      articleCount: articles.length,
      source: "Tavily News + Qwen3 AI",
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
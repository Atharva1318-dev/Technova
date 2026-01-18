import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, Search, AlertCircle } from "lucide-react";

const HotStocksPage = () => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [timeframe, setTimeframe] = useState("1"); // 1 min or 15 min
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [dataType, setDataType] = useState("historical"); // "intraday" or "historical"
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-01-02");

  // Popular stocks with their ISIN codes (matching AdvisorTradePage)
  const popularStocks = [
    { name: "Reliance Industries Ltd", ISIN: "INE002A01018" },
    { name: "Tata Consultancy Services Ltd.", ISIN: "INE467B01029" },
    { name: "HDFC Bank Ltd.", ISIN: "INE040A01034" },
    { name: "ICICI Bank Ltd.", ISIN: "INE090A01021" },
    { name: "Bharti Airtel Ltd.", ISIN: "INE397D01024" },
    { name: "State Bank Of India", ISIN: "INE062A01020" },
    { name: "Life Insurance Corporation Of India", ISIN: "INE0J1Y01017" },
    { name: "Infosys Ltd", ISIN: "INE009A01021" },
    { name: "ITC Ltd", ISIN: "INE154A01025" },
    { name: "Hindustan Unilever Ltd.", ISIN: "INE030A01027" },
    { name: "Larsen & Toubro Limited", ISIN: "INE018A01030" },
    { name: "Maruti Suzuki India Ltd.", ISIN: "INE585B01010" },
    { name: "HCL Technologies Ltd", ISIN: "INE860A01027" },
    { name: "Sun Pharmaceutical Industries Ltd.", ISIN: "INE044A01036" },
    { name: "Axis Bank Ltd.", ISIN: "INE238A01034" },
    { name: "Oil And Natural Gas Corporation Ltd", ISIN: "INE213A01029" },
    { name: "NTPC Limited", ISIN: "INE733E01010" },
    { name: "Tata Motors Ltd.", ISIN: "INE155A01022" },
    { name: "Kotak Mahindra Bank Ltd.", ISIN: "INE237A01028" },
    { name: "Titan Company Limited", ISIN: "INE280A01028" },
    { name: "Avenue Supermarts Limited", ISIN: "INE192R01011" },
    { name: "UltraTech Cement Ltd", ISIN: "INE481G01011" },
    {
      name: "Adani Ports and Special Economic Zone Ltd",
      ISIN: "INE742F01042",
    },
    { name: "Coal India Limited", ISIN: "INE522F01014" },
    { name: "Asian Paints Ltd.", ISIN: "INE021A01026" },
    { name: "Power Grid Corporation Of India Limited", ISIN: "INE752E01010" },
    { name: "Hindustan Aeronautics Ltd.", ISIN: "INE066F01020" },
    { name: "Mahindra & Mahindra Ltd.", ISIN: "INE101A01026" },
    { name: "Indian Oil Corporation Ltd.", ISIN: "INE242A01010" },
    { name: "Nestle India Ltd.", ISIN: "INE239A01024" },
    { name: "Wipro Ltd.", ISIN: "INE075A01022" },
    { name: "Jio Financial Services Ltd.", ISIN: "INE758E01017" },
    { name: "DLF Limited", ISIN: "INE271C01023" },
    { name: "JSW Steel Limited", ISIN: "INE019A01038" },
    { name: "Indian Railway Finance Corporation", ISIN: "INE053F01010" },
    { name: "Tata Steel Limited", ISIN: "INE081A01020" },
    { name: "Siemens Ltd.", ISIN: "INE003A01024" },
    { name: "Varun Beverages Limited", ISIN: "INE200M01021" },
    { name: "Hindustan Zinc Ltd.", ISIN: "INE267A01025" },
    { name: "Bharat Electronics Ltd.", ISIN: "INE263A01024" },
    { name: "Zomato Limited", ISIN: "INE758T01015" },
  
    { name: "Ambuja Cements Ltd.", ISIN: "INE079A01024" },
    { name: "Grasim Industries Ltd.", ISIN: "INE047A01021" },
    { name: "Trent Ltd", ISIN: "INE849A01020" },
    { name: "Pidilite Industries Ltd.", ISIN: "INE318A01026" },
    { name: "InterGlobe Aviation Limited", ISIN: "INE646L01027" },
    { name: "Punjab National Bank", ISIN: "INE160A01022" },
    { name: "Hindalco Industries Ltd.", ISIN: "INE038A01020" },
    { name: "Tata Power Co. Ltd", ISIN: "INE245A01021" },
    { name: "SBI Life Insurance Company Limited", ISIN: "INE123W01016" },
    { name: "Bank Of Baroda", ISIN: "INE028A01039" },
    { name: "LTIMindtree Limited", ISIN: "INE214T01019" },
    { name: "Gail (India) Ltd.", ISIN: "INE129A01019" },
    { name: "Power Finance Corporation Ltd", ISIN: "INE134E01011" },
    { name: "ABB India Limited", ISIN: "INE117A01022" },
    { name: "Bharat Petroleum Corpn. Ltd.", ISIN: "INE029A01011" },
    { name: "Indian Overseas Bank", ISIN: "INE565A01014" },
    { name: "Tech Mahindra Limited", ISIN: "INE669C01036" },
    { name: "Eicher Motors Ltd.", ISIN: "INE066A01021" },
    { name: "Godrej Consumer Products Ltd.", ISIN: "INE102D01028" },
    { name: "HDFC Life Insurance Company Limited", ISIN: "INE795G01014" },
    { name: "REC Limited", ISIN: "INE020B01018" },
    { name: "Union Bank of India", ISIN: "INE692A01016" },
    { name: "IndusInd Bank Ltd.", ISIN: "INE095A01012" },
    { name: "Britannia Industries Ltd.", ISIN: "INE216A01030" },
    { name: "Cipla Ltd.", ISIN: "INE059A01026" },
    { name: "Canara Bank", ISIN: "INE476A01014" },
    { name: "Divi's Laboratories Ltd.", ISIN: "INE361B01024" },
    { name: "JSW Energy Limited", ISIN: "INE121E01018" },
    { name: "Dr. Reddy's Laboratories Ltd.", ISIN: "INE089A01023" },
    { name: "Tata Consumer Products Limited", ISIN: "INE192A01025" },
    { name: "Havells India Limited", ISIN: "INE176B01034" },
    { name: "IDBI Bank Ltd", ISIN: "INE008A01015" },
    {
      name: "Cholamandalam Investment and Finance Company Ltd",
      ISIN: "INE121A01024",
    },
    { name: "Zydus Lifesciences Limited", ISIN: "INE010B01027" },
    { name: "TVS Motor Company Ltd.", ISIN: "INE494B01023" },
    { name: "Bharat Heavy Electricals Ltd.", ISIN: "INE257A01026" },
    { name: "Jindal Steel & Power Ltd", ISIN: "INE749A01030" },
    { name: "Mankind Pharma Limited", ISIN: "INE634S01028" },
    { name: "Indus Towers Limited", ISIN: "INE121J01017" },
    { name: "NHPC Limited", ISIN: "INE848E01016" },
    { name: "Shriram Finance Limited", ISIN: "INE721A01013" },
  
    // Note: Sr No 83 is not visible in the images you shared.
    { name: "Torrent Pharmaceuticals Ltd.", ISIN: "INE685A01028" },
    { name: "Dabur India Ltd.", ISIN: "INE016A01026" },
    { name: "Hero MotoCorp Limited", ISIN: "INE158A01026" },
    {
      name: "Samvardhana Motherson International Limited",
      ISIN: "INE775A01035",
    },
    { name: "Shree Cements Ltd.", ISIN: "INE070A01015" },
    { name: "Bosch Ltd", ISIN: "INE323A01026" },
    { name: "United Spirits Limited", ISIN: "INE854D01024" },
    { name: "Apollo Hospitals Enterprises Ltd.", ISIN: "INE437A01024" },
    { name: "CG Power and Industrial Solutions Limited", ISIN: "INE067A01029" },
    {
      name: "ICICI Lombard General Insurance Company Limited",
      ISIN: "INE765G01017",
    },
    {
      name: "Indian Railway Catering & Tourism Corporation Ltd",
      ISIN: "INE335Y01020",
    },
    { name: "Indian Hotels Co. Ltd", ISIN: "INE053A01029" },
    { name: "Yes Bank Ltd.", ISIN: "INE528G01035" },
    { name: "Max Healthcare Institute Limited", ISIN: "INE027H01010" },
    {
      name: "ICICI Prudential Life Insurance Company Limited",
      ISIN: "INE726G01019",
    },
    { name: "HDFC Asset Management Company Ltd", ISIN: "INE127D01025" },
    { name: "Solar Industries India Limited", ISIN: "INE343H01029" },
    { name: "Info Edge (India) Ltd.", ISIN: "INE663F01024" },
    { name: "SRF Ltd.", ISIN: "INE647A01010" },
    { name: "Colgate-Palmolive (India) Ltd.", ISIN: "INE259A01022" },
    { name: "Indian Bank", ISIN: "INE562A01011" },
    { name: "NMDC Ltd", ISIN: "INE584A01023" },
    { name: "Lupin Ltd", ISIN: "INE326A01037" },
    { name: "Torrent Power Limited", ISIN: "INE813H01021" },
    { name: "Godrej Properties Limited", ISIN: "INE484J01027" },
    { name: "Hindustan Petroleum Corporation Ltd", ISIN: "INE094A01015" },
    { name: "Tube Investments of India Ltd", ISIN: "INE974X01010" },
    { name: "Bank of India", ISIN: "INE084A01016" },
    { name: "Linde India Limited", ISIN: "INE473A01011" },
    { name: "UCO Bank", ISIN: "INE691A01018" },
    { name: "SBI Cards and Payment Services Limited", ISIN: "INE018E01016" },
    { name: "Muthoot Finance Limited", ISIN: "INE414G01012" },
    { name: "Steel Authority of India Ltd.", ISIN: "INE114A01011" },
    { name: "Aurobindo Pharma Ltd.", ISIN: "INE406A01037" },
    { name: "Oil India Limited", ISIN: "INE274J01014" },
    { name: "Marico Limited", ISIN: "INE196A01026" },
    { name: "Oracle Financial Services Software Limited", ISIN: "INE881D01027" },
    { name: "Container Corporation Of India Ltd.", ISIN: "INE111A01025" },
    { name: "Supreme Industries Ltd.", ISIN: "INE195A01028" },
    { name: "Aditya Birla Capital Ltd", ISIN: "INE674K01013" },
    { name: "General Insurance Corporation of India", ISIN: "INE481Y01014" },
    { name: "Rail Vikas Nigam Limited", ISIN: "INE415G01027" },
  
    { name: "Bharat Forge Ltd", ISIN: "INE465A01025" },
    { name: "Central Bank of India", ISIN: "INE483A01010" },
    { name: "Berger Paints India Ltd", ISIN: "INE463A01038" },
    { name: "Alkem Laboratories Limited", ISIN: "INE540L01014" },
    { name: "IDFC First Bank Limited", ISIN: "INE092T01019" },
    { name: "Jindal Stainless Limited", ISIN: "INE220G01021" },
    { name: "PI Industries Limited", ISIN: "INE603J01030" },
    { name: "PB Fintech Limited", ISIN: "INE417T01026" },
    { name: "Abbott India Ltd.", ISIN: "INE358A01014" },
    { name: "M.R.F. Ltd.", ISIN: "INE883A01011" },
    { name: "Astral Limited", ISIN: "INE006I01046" },
    { name: "Ashok Leyland Ltd.", ISIN: "INE208A01029" },
    { name: "Schaeffler India Limited", ISIN: "INE513A01022" },
    { name: "The Phoenix Mills Ltd.", ISIN: "INE211B01039" },
    { name: "United Breweries Ltd.", ISIN: "INE686F01025" },
    { name: "SJVN Limited", ISIN: "INE002L01015" },
    { name: "Oberoi Realty Limited", ISIN: "INE093I01010" },
    { name: "Sundaram Finance Ltd", ISIN: "INE660A01013" },
    { name: "Prestige Estates Projects Limited", ISIN: "INE811K01011" },
    { name: "Thermax Ltd.", ISIN: "INE152A01029" },
    { name: "Procter & Gamble Hygiene & Health Care Ltd.", ISIN: "INE179A01014" },
    { name: "Persistent Systems Limited", ISIN: "INE262H01021" },
    { name: "Dixon Technologies (India) Limited", ISIN: "INE935N01020" },
    { name: "FSN E-Commerce Ventures Limited", ISIN: "INE388Y01029" },
    { name: "Bank of Maharashtra", ISIN: "INE457A01014" },
    { name: "L&T Technology Services Limited", ISIN: "INE010V01017" },
    { name: "Tata Communications Limited", ISIN: "INE151A01013" },
    { name: "Voltas Ltd.", ISIN: "INE226A01021" },
    { name: "Mazagon Dock Shipbuilders Limited", ISIN: "INE249Z01012" },
    { name: "AU Small Finance Bank Limited", ISIN: "INE949L01017" },
    { name: "ACC Ltd", ISIN: "INE012A01025" },
    { name: "Fertilizers and Chemicals Travancore Limited", ISIN: "INE188A01015" },
    { name: "Balkrishna Industries Ltd.", ISIN: "INE787D01026" },
    { name: "Housing & Urban Development Corporation Ltd.", ISIN: "INE031A01017" },
    { name: "Petronet LNG Ltd.", ISIN: "INE347G01014" },
    { name: "Mphasis Limited", ISIN: "INE356A01018" },
    { name: "Tata Elxsi Ltd", ISIN: "INE670A01012" },
    { name: "Mangalore Refinery & Petrochemicals", ISIN: "INE103A01014" },
    { name: "Punjab & Sind Bank", ISIN: "INE608A01012" },
    { name: "Tata Technologies Limited", ISIN: "INE142M01025" },
    { name: "APL Apollo Tubes Limited", ISIN: "INE702C01027" },
    { name: "L&T Finance Holdings Limited", ISIN: "INE498L01015" },
  
    { name: "UNO Minda Limited", ISIN: "INE405E01023" },
    { name: "The New India Assurance Company Limited", ISIN: "INE470Y01017" },
    { name: "KPIT Technologies Ltd", ISIN: "INE04I401011" },
    { name: "Gujarat Fluorochemicals Limited", ISIN: "INE09N301011" },
    { name: "Honeywell Automation India Ltd.", ISIN: "INE671A01010" },
    { name: "Page Industries Ltd.", ISIN: "INE761H01022" },
    { name: "Federal Bank Ltd.", ISIN: "INE171A01029" },
    { name: "Global Health Limited", ISIN: "INE474Q01031" },
    { name: "Exide Industries Ltd.", ISIN: "INE302A01020" },
    { name: "UPL Limited", ISIN: "INE628A01036" },
    { name: "Gujarat Gas Limited", ISIN: "INE844O01030" },
    { name: "Poonawalla Fincorp Limited", ISIN: "INE511C01022" },
    { name: "Hindustan Copper Ltd.", ISIN: "INE531E01026" },
    { name: "BSE Ltd", ISIN: "INE118H01025" },
    { name: "Sona BLW Precision Forgings Limited", ISIN: "INE073K01018" },
    { name: "Motilal Oswal Financial Services Limited", ISIN: "INE338I01027" },
    { name: "Nippon Life India Asset Management Limited", ISIN: "INE298J01013" },
    { name: "Hitachi Energy India Limited", ISIN: "INE07Y701011" },
    { name: "Biocon Ltd.", ISIN: "INE376G01013" },
    { name: "LIC Housing Finance Ltd.", ISIN: "INE115A01026" },
    { name: "Escorts Kubota Limited", ISIN: "INE042A01014" },
    { name: "Bharat Dynamics Limited", ISIN: "INE171Z01018" },
    { name: "GlaxoSmithkline Pharmaceuticals Ltd.", ISIN: "INE159A01016" },
    { name: "AI Engineering Ltd.", ISIN: "INE212H01026" },
    { name: "Coromandel International Limited", ISIN: "INE169A01031" },
    { name: "Cochin Shipyard Limited", ISIN: "INE704P01025" },
    { name: "KEI Industries Ltd.", ISIN: "INE878B01027" },
    { name: "National Aluminium Co. Ltd.", ISIN: "INE139A01034" },
    { name: "Tata Motors Ltd - DVR", ISIN: "INE195A01020" },
    { name: "Dalmia Bharat Limited", ISIN: "INE00R701025" },
    { name: "NLC India Limited", ISIN: "INE589A01014" },
    { name: "Ipca Laboratories Ltd.", ISIN: "INE571A01038" },
    { name: "3M India Ltd.", ISIN: "INE470A01017" },
    { name: "Max Financial Services Limited", ISIN: "INE180A01020" },
    { name: "Fortis Healthcare Ltd", ISIN: "INE061F01013" },
    { name: "Deepak Nitrite Limited", ISIN: "INE288B01029" },
    {
      name: "Star Health and Allied Insurance Company Limited",
      ISIN: "INE575P01011",
    },
    { name: "Indraprastha Gas Ltd.", ISIN: "INE203G01027" },
    { name: "CRISIL Ltd.", ISIN: "INE007A01025" },
    {
      name: "Mahindra & Mahindra Financial Services Limited",
      ISIN: "INE774D01024",
    },
    { name: "Coforge Limited", ISIN: "INE591G01017" },
    { name: "Apar Industries Ltd", ISIN: "INE372A01015" },
  
    { name: "J.K. Cement Ltd", ISIN: "INE823G01014" },
    { name: "Apollo Tyres Ltd", ISIN: "INE438A01022" },
    { name: "Motherson Sumi Wiring India Limited", ISIN: "INE0FS801015" },
    { name: "Godrej Industries Ltd.", ISIN: "INE233A01035" },
    { name: "Blue Star Ltd", ISIN: "INE472A01039" },
    { name: "Glenmark Pharmaceuticals Ltd", ISIN: "INE935A01035" },
    { name: "EIH Ltd", ISIN: "INE230A01023" },
    { name: "Bandhan Bank Limited", ISIN: "INE545U01014" },
    { name: "JB Chemicals & Pharmaceuticals Ltd.", ISIN: "INE572A01036" },
    { name: "Jubilant FoodWorks Limited", ISIN: "INE797F01020" },
    { name: "K.P.R. Mill Ltd.", ISIN: "INE930H01031" },
    { name: "Gland Pharma Limited", ISIN: "INE068V01023" },
    { name: "360 ONE WAM LIMITED", ISIN: "INE466L01038" },
    { name: "Syngene International Limited", ISIN: "INE398R01022" },
    { name: "Tata Chemicals Ltd", ISIN: "INE092A01019" },
    { name: "Ajanta Pharma Ltd.", ISIN: "INE031B01049" },
    { name: "Endurance Technologies Limited", ISIN: "INE913H01037" },
    { name: "Carborundum Universal Ltd.", ISIN: "INE120A01034" },
    { name: "Aarti Industries Ltd", ISIN: "INE769A01020" },
    { name: "Aditya Birla Fashion and Retail Limited", ISIN: "INE647O01011" },
    { name: "Narayana Hrudayalaya Limited", ISIN: "INE410P01011" },
    { name: "Sun TV Network Limited", ISIN: "INE424H01027" },
    { name: "NBCC (India) Limited", ISIN: "INE095N01031" },
    { name: "Angel One Limited", ISIN: "INE732I01013" },
    { name: "ICICI Securities Limited", ISIN: "INE763G01038" },
    { name: "Aegis Logistics Ltd.", ISIN: "INE208C01025" },
    { name: "Bayer CropScience Limited.", ISIN: "INE462A01022" },
    { name: "Timken India Ltd", ISIN: "INE325A01013" },
    { name: "IRCON International Ltd", ISIN: "INE962Y01021" },
    { name: "Laurus Labs Limited", ISIN: "INE947Q01028" },
    { name: "CreditAccess Grameen Ltd.", ISIN: "INE741K01010" },
    { name: "Vedant Fashions Limited", ISIN: "INE825V01034" },
    { name: "Sundram Fasteners Ltd.", ISIN: "INE387A01021" },
    { name: "Grindwell Norton Ltd.", ISIN: "INE536A01023" },
    { name: "Kansai Nerolac Paints", ISIN: "INE531A01024" },
    { name: "SKF India Ltd.", ISIN: "INE640A01023" },
    { name: "Century Textiles & Industries Ltd.", ISIN: "INE055A01016" },
    { name: "Central Depository Services (India) Limited", ISIN: "INE736A01011" },
    { name: "Emami Ltd", ISIN: "INE548C01032" },
    { name: "Castrol India Ltd", ISIN: "INE172A01027" },
    { name: "Piramal Enterprises Limited", ISIN: "INE140A01024" },
    { name: "PNB Housing Finance Limited", ISIN: "INE572E01012" },
  ];
  // Check if market is open (9:15 AM to 3:15 PM IST)
  const isMarketOpen = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentTime = hours * 60 + minutes;
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 15; // 3:15 PM
    return currentTime >= marketOpen && currentTime <= marketClose;
  };

  // Filter stocks based on search query
  const filteredStocks = popularStocks.filter(stock =>
    stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.ISIN.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedStock) {
      fetchStockData();
    }
  }, [selectedStock, timeframe, dataType, fromDate, toDate]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStockData = async () => {
    if (!selectedStock) return;
    
    setLoading(true);
    try {
      let apiUrl = "";
      
      if (dataType === "intraday") {
        // Intraday API
        apiUrl = `https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7C${selectedStock.ISIN}/minutes/${timeframe}`;
      } else {
        // Historical API
        apiUrl = `https://api.upstox.com/v3/historical-candle/NSE_EQ%7C${selectedStock.ISIN}/minutes/${timeframe}/${toDate}/${fromDate}`;
      }

      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.data && response.data.data.candles) {
        const candles = response.data.data.candles;
        
        // Transform candles data: [timestamp, open, high, low, close, volume, oi]
        const transformedData = candles.map((candle) => ({
          time: new Date(candle[0]).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          price: candle[4], // close price
          open: candle[1],
          high: candle[2],
          low: candle[3],
          volume: candle[5]
        })).reverse(); // Reverse to show chronological order

        setChartData(transformedData);
        
        if (transformedData.length > 0) {
          const latestPrice = transformedData[transformedData.length - 1].price;
          const firstPrice = transformedData[0].price;
          const change = latestPrice - firstPrice;
          const changePercent = ((change / firstPrice) * 100);
          
          setStockInfo({
            symbol: selectedStock.name,
            currentPrice: latestPrice,
            change: change,
            changePercent: changePercent,
            high: Math.max(...transformedData.map(d => d.high)),
            low: Math.min(...transformedData.map(d => d.low)),
            volume: transformedData.reduce((sum, d) => sum + d.volume, 0),
          });
        }
      } else {
        toast.error("No data available for selected parameters");
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
      toast.error("Failed to load chart data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (stock) => {
    setSelectedStock(stock);
    setSearchQuery(stock.name);
    setShowSearchResults(false);
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hot Stocks</h1>
          <p className="text-gray-700 mt-1">Real-time market data and charts</p>
        </div>
        <button
          onClick={fetchStockData}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0056b3] to-[#6d28d9] text-white rounded-lg hover:from-[#004996] hover:to-[#5b21b6] transition font-semibold shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stock Selector and Controls */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-4">
        {/* Search and Quick Select */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px] relative search-container">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stock by name or ISIN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0056b3] bg-white text-gray-900"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredStocks.length > 0 ? (
                  filteredStocks.slice(0, 10).map((stock) => (
                    <button
                      key={stock.ISIN}
                      onClick={() => {
                        setSelectedStock(stock);
                        setSearchQuery(stock.name);
                        setShowSearchResults(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition text-gray-900"
                    >
                      <div className="font-medium">{stock.name}</div>
                      <div className="text-xs text-gray-500">{stock.ISIN}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">No stocks found</div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {popularStocks.slice(0, 4).map((stock) => (
              <button
                key={stock.ISIN}
                onClick={() => {
                  setSelectedStock(stock);
                  setSearchQuery(stock.name);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  selectedStock?.ISIN === stock.ISIN
                    ? "bg-[#0056b3] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {stock.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Data Type and Timeframe Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Data Type Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setDataType("historical")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                dataType === "historical"
                  ? "bg-[#0056b3] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Historical
            </button>
            <button
              onClick={() => {
                if (isMarketOpen()) {
                  setDataType("intraday");
                } else {
                  toast.warning("Intraday data is only available during market hours (9:15 AM - 3:15 PM IST)");
                }
              }}
              disabled={!isMarketOpen()}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                dataType === "intraday"
                  ? "bg-[#0056b3] text-white"
                  : isMarketOpen()
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              Intraday {!isMarketOpen() && "🔒"}
            </button>
          </div>

          {/* Historical Date Range */}
          {dataType === "historical" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0056b3] bg-white text-gray-900"
              />
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0056b3] bg-white text-gray-900"
              />
            </div>
          )}

          {/* Timeframe Selection */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setTimeframe("1")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                timeframe === "1"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              1 Min
            </button>
            <button
              onClick={() => setTimeframe("15")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                timeframe === "15"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              15 Min
            </button>
            <button
              onClick={fetchStockData}
              disabled={!selectedStock}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Stock Info */}
      {stockInfo && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{stockInfo.symbol}</h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">₹{stockInfo.currentPrice.toFixed(2)}</p>
            </div>
            <div className={`text-right ${parseFloat(stockInfo.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <div className="flex items-center gap-2 justify-end">
                {parseFloat(stockInfo.change) >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="text-xl font-bold">{stockInfo.change.toFixed(2)}</span>
              </div>
              <p className="text-lg font-semibold mt-1">({stockInfo.changePercent.toFixed(2)}%)</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Price Chart ({timeframe} min - {dataType === "intraday" ? "Intraday" : `${fromDate} to ${toDate}`})
          </h3>
          {selectedStock && (
            <span className="text-sm text-gray-500">ISIN: {selectedStock.ISIN}</span>
          )}
        </div>
        {!selectedStock ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
            <Search className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Select a stock to view chart</p>
            <p className="text-sm">Search or click on a quick select button above</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056b3] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading chart data...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mb-4 text-gray-300 mx-auto" />
              <p className="text-lg font-medium">No data available</p>
              <p className="text-sm">Try selecting different dates or timeframe</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#666" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#666" 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  color: '#333'
                }}
                formatter={(value, name) => {
                  if (name === 'price') return [`₹${value.toFixed(2)}`, 'Close'];
                  return [value, name];
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#0056b3" 
                strokeWidth={2}
                dot={false}
                name="Close Price"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};

export default HotStocksPage;
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Search,
  Edit2,
  X as CloseIcon,
  Plus,
  AlertCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AdvisorTradePage = () => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [timeframe, setTimeframe] = useState("1");
  const [chartData, setChartData] = useState([]);
  const [stockInfo, setStockInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [dataType, setDataType] = useState("historical"); // "intraday" or "historical"
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-01-02");
  const [activeTrades, setActiveTrades] = useState([]);
  const [showSignalCreator, setShowSignalCreator] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const { serverUrl } = useContext(AuthDataContext);

  // Signal Creator Form State
  const [signalForm, setSignalForm] = useState({
    instrument: "stock",
    symbol: "",
    action: "buy",
    entryPrice: "",
    target: "",
    stopLoss: "",
    riskLevel: "medium",
    validity: "intraday",
    notes: ""
  });

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
      fetchChartData();
    }
    fetchActiveTrades();
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

  const fetchChartData = async () => {
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
            price: latestPrice.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2)
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

  const fetchActiveTrades = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/advisor/trades?status=active`,
        { withCredentials: true }
      );
      setActiveTrades(response.data.trades || []);
    } catch (error) {
      console.error("Error fetching active trades:", error);
    }
  };

  const handleCreateSignal = async (e) => {
    e.preventDefault();
    
    if (!signalForm.symbol || !signalForm.entryPrice || !signalForm.target || !signalForm.stopLoss) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.post(
        `${serverUrl}/api/advisor/signal/create`,
        {
          ...signalForm,
          orderType: "market",
          direction: signalForm.action,
          quantity: 1
        },
        { withCredentials: true }
      );
      
      toast.success("Signal created successfully!");
      setShowSignalCreator(false);
      setSignalForm({
        instrument: "stock",
        symbol: "",
        action: "buy",
        entryPrice: "",
        target: "",
        stopLoss: "",
        riskLevel: "medium",
        validity: "intraday",
        notes: ""
      });
      fetchActiveTrades();
    } catch (error) {
      console.error("Error creating signal:", error);
      toast.error(error.response?.data?.message || "Failed to create signal");
    }
  };

  const handleEditTrade = async (tradeId, updates) => {
    try {
      await axios.put(
        `${serverUrl}/api/advisor/trade/${tradeId}`,
        updates,
        { withCredentials: true }
      );
      toast.success("Trade updated successfully");
      setEditingTrade(null);
      fetchActiveTrades();
    } catch (error) {
      console.error("Error updating trade:", error);
      toast.error("Failed to update trade");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trade</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create signals and manage active trades</p>
        </div>
        <button
          onClick={() => setShowSignalCreator(!showSignalCreator)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0056b3] text-white rounded-lg hover:bg-[#004996] transition font-medium shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create New Signal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stock Selector and Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            {/* Search and Quick Select */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[250px] relative search-container">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search stock by name or ISIN..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0056b3] dark:focus:border-[#0056b3] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchQuery && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStocks.length > 0 ? (
                      filteredStocks.slice(0, 10).map((stock) => (
                        <button
                          key={stock.ISIN}
                          onClick={() => {
                            setSelectedStock(stock);
                            setSearchQuery(stock.name);
                            setShowSearchResults(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"
                        >
                          <div className="font-medium">{stock.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{stock.ISIN}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No stocks found</div>
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
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      : "bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Intraday {!isMarketOpen() && "🔒"}
                </button>
              </div>

              {/* Historical Date Range */}
              {dataType === "historical" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    max={toDate}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-[#0056b3] dark:focus:border-[#0056b3] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-[#0056b3] dark:focus:border-[#0056b3] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  1 Min
                </button>
                <button
                  onClick={() => setTimeframe("15")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    timeframe === "15"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  15 Min
                </button>
                <button
                  onClick={fetchChartData}
                  disabled={!selectedStock}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Stock Info */}
          {stockInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{stockInfo.symbol}</h2>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₹{stockInfo.price}</p>
                </div>
                <div className={`text-right ${parseFloat(stockInfo.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <div className="flex items-center gap-2 justify-end">
                    {parseFloat(stockInfo.change) >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span className="text-xl font-bold">{stockInfo.change}</span>
                  </div>
                  <p className="text-lg font-semibold mt-1">({stockInfo.changePercent}%)</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Price Chart ({timeframe} min - {dataType === "intraday" ? "Intraday" : `${fromDate} to ${toDate}`})
              </h3>
              {selectedStock && (
                <span className="text-sm text-gray-500 dark:text-gray-400">ISIN: {selectedStock.ISIN}</span>
              )}
            </div>
            {!selectedStock ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
                <Search className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium">Select a stock to view chart</p>
                <p className="text-sm">Search or click on a quick select button above</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056b3] mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading chart data...</p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600 mx-auto" />
                  <p className="text-lg font-medium">No data available</p>
                  <p className="text-sm">Try selecting different dates or timeframe</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#666 dark:stroke-gray-400" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="#666 dark:stroke-gray-400" 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff dark:bg-gray-800', 
                      border: '1px solid #ddd dark:border-gray-700',
                      borderRadius: '8px',
                      color: '#333 dark:text-white'
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

        {/* Active Trades Sidebar - 1/3 width */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Active & Pending Trades</h3>
            
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {activeTrades.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No active trades</p>
                </div>
              ) : (
                activeTrades.map((trade) => (
                  <div 
                    key={trade._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900 dark:text-white">{trade.symbol}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        trade.direction === 'buy' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {trade.direction.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Entry:</span>
                        <span className="font-semibold dark:text-white">₹{trade.entryPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">₹{trade.target}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SL:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">₹{trade.stopLoss}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingTrade(trade)}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Trade
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Signal Modal Popup - FIXED TEXT COLOR */}
      {showSignalCreator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#0056b3] to-[#4c1d95]">
              <h3 className="text-2xl font-bold text-white">Create New Trading Signal</h3>
              <button
                onClick={() => setShowSignalCreator(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <CloseIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleCreateSignal} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Instrument Selection - FIXED */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Instrument Type *
                    </label>
                    <select
                      value={signalForm.instrument}
                      onChange={(e) => setSignalForm({ ...signalForm, instrument: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-[#0056b3]/20 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="stock" className="text-gray-900 dark:text-white">Stock</option>
                      <option value="futures" className="text-gray-900 dark:text-white">Futures & Options</option>
                      <option value="index" className="text-gray-900 dark:text-white">Index</option>
                      <option value="commodity" className="text-gray-900 dark:text-white">Commodity</option>
                    </select>
                  </div>

                  {/* Symbol - FIXED */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      value={signalForm.symbol}
                      onChange={(e) => setSignalForm({ ...signalForm, symbol: e.target.value.toUpperCase() })}
                      placeholder="e.g., RELIANCE, NIFTY"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-[#0056b3]/20 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>

                  {/* Action Type - FIXED */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Action Type *
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setSignalForm({ ...signalForm, action: "buy" })}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                          signalForm.action === "buy"
                            ? "bg-green-600 text-white shadow-lg transform scale-105"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        📈 Buy
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignalForm({ ...signalForm, action: "sell" })}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                          signalForm.action === "sell"
                            ? "bg-red-600 text-white shadow-lg transform scale-105"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        📉 Sell
                      </button>
                    </div>
                  </div>

                  {/* Entry Price - FIXED */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Entry Price * (Auto-locked)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={signalForm.entryPrice}
                        onChange={(e) => setSignalForm({ ...signalForm, entryPrice: e.target.value })}
                        placeholder="Current market price"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-[#0056b3]/20 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Target Price - FIXED */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Target Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={signalForm.target}
                        onChange={(e) => setSignalForm({ ...signalForm, target: e.target.value })}
                        placeholder="Target price"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-[#0056b3]/20 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Stop Loss - FIXED */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Stop Loss *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={signalForm.stopLoss}
                        onChange={(e) => setSignalForm({ ...signalForm, stopLoss: e.target.value })}
                        placeholder="Stop loss price"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-[#0056b3]/20 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Risk Level - FIXED */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Risk Level *
                    </label>
                    <select
                      value={signalForm.riskLevel}
                      onChange={(e) => setSignalForm({ ...signalForm, riskLevel: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-[#0056b3]/20 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low" className="text-gray-900 dark:text-white">🟢 Low Risk</option>
                      <option value="medium" className="text-gray-900 dark:text-white">🟡 Medium Risk</option>
                      <option value="high" className="text-gray-900 dark:text-white">🔴 High Risk</option>
                    </select>
                  </div>

                  {/* Validity - FIXED */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Validity *
                    </label>
                    <select
                      value={signalForm.validity}
                      onChange={(e) => setSignalForm({ ...signalForm, validity: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-[#0056b3]/20 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="intraday" className="text-gray-900 dark:text-white">Intraday</option>
                      <option value="positional" className="text-gray-900 dark:text-white">Positional</option>
                      <option value="btst" className="text-gray-900 dark:text-white">BTST</option>
                    </select>
                  </div>
                </div>

                {/* Notes - FIXED */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Rationale/Notes (Optional)
                  </label>
                  <textarea
                    value={signalForm.notes}
                    onChange={(e) => setSignalForm({ ...signalForm, notes: e.target.value })}
                    placeholder="Add your detailed analysis, market reasoning, and trading strategy..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-[#0056b3]/20 transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                {/* Warning */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5 flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">⚠️ Important Notice</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Once published, this trading signal cannot be edited or deleted. It will be visible to all your subscribers. Please review all details carefully before publishing.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSignalCreator(false)}
                    className="flex-1 py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-[#0056b3] to-[#4c1d95] text-white font-semibold rounded-xl hover:shadow-xl transition-all"
                  >
                    🚀 Publish Signal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      {editingTrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Trade</h3>
              <button
                onClick={() => setEditingTrade(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <CloseIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={editingTrade.target}
                  id="edit-target"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0056b3] dark:focus:border-[#0056b3] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={editingTrade.stopLoss}
                  id="edit-sl"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0056b3] dark:focus:border-[#0056b3] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={() => {
                  const target = document.getElementById("edit-target").value;
                  const stopLoss = document.getElementById("edit-sl").value;
                  handleEditTrade(editingTrade._id, { target, stopLoss });
                }}
                className="w-full py-3 bg-[#0056b3] text-white font-semibold rounded-lg hover:bg-[#004996] transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorTradePage;
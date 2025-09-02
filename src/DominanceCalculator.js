import { useState, useEffect } from "react";
import "./LiveBTCDominance.css";

export default function LiveBTCDominance() {
  const [btcPrice, setBtcPrice] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [totalMarket, setTotalMarket] = useState(0);
  const [btcDominance, setBtcDominance] = useState(0);

  const [estDominance, setEstDominance] = useState(""); 
  const [estTotal, setEstTotal] = useState(""); 

  // Flash animasyonu state’leri
  const [btcFlash, setBtcFlash] = useState("");
  const [ethFlash, setEthFlash] = useState("");

  // Binance WebSocket ile BTC ve ETH fiyatları
  useEffect(() => {
    const wsBTC = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker");
    wsBTC.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setBtcPrice((prev) => {
        const newPrice = parseFloat(data.c);
        if (newPrice > prev) setBtcFlash("flash-green");
        else if (newPrice < prev) setBtcFlash("flash-red");
        setTimeout(() => setBtcFlash(""), 500);
        return newPrice;
      });
    };
    const wsETH = new WebSocket("wss://stream.binance.com:9443/ws/ethusdt@ticker");
    wsETH.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEthPrice((prev) => {
        const newPrice = parseFloat(data.c);
        if (newPrice > prev) setEthFlash("flash-green");
        else if (newPrice < prev) setEthFlash("flash-red");
        setTimeout(() => setEthFlash(""), 500);
        return newPrice;
      });
    };

    return () => {
      wsBTC.close();
      wsETH.close();
    };
  }, []);

  // CoinGecko API ile BTC.D ve Total Market Cap
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/global");
        const data = await res.json();
        setTotalMarket(data.data.total_market_cap.usd);
        setBtcDominance(data.data.market_cap_percentage.btc);
      } catch (error) {
        console.error("Global data fetch error:", error);
      }
    };

    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Hesaplamalar
  const btcMarketCap = totalMarket * (btcDominance / 100);
  const total2 = totalMarket - btcMarketCap;

  const parseEstimatedTotal = (value) => {
    if (!value) return 0;
    return parseFloat(value) * 1e12; 
  };

  const estTotalValue = parseEstimatedTotal(estTotal);
  const estBtcMarketCap =
    estDominance && estTotalValue
      ? (parseFloat(estDominance) / 100) * estTotalValue
      : 0;
  const estTotal2 =
    estTotalValue && estBtcMarketCap ? estTotalValue - estBtcMarketCap : 0;

  const calcDiff = (current, estimated) => {
    if (!current || !estimated) return 0;
    return ((estimated - current) / current) * 100;
  };

  const formatNumber = (num) => {
    if (!num) return 0;
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
  };

  const getDiffColor = (diff) => (diff > 0 ? "green" : diff < 0 ? "red" : "#bbb");

  // Trend yorumu
  const trendComment = () => {
    if (!estDominance || !estTotal) return "";
    const diffBTC = estDominance - btcDominance;
    const diffTotal = estTotalValue - totalMarket;

    if (diffBTC > 0 && diffTotal > 0) {
      return "📈 BTC.D Yükselir + Total Yükselir → Altcoinler BTC’ye göre zarar eder, Bitcoin boğa sezonu başlangıcı.";
    }
    if (diffBTC > 0 && diffTotal < 0) {
      return "⚠️ BTC.D Yükselir + Total Düşer → Kripto piyasası ayı sezonu, Tether’e geçiş yapılmalı.";
    }
    if (diffBTC < 0 && diffTotal > 0) {
      return "🚀 BTC.D Düşer + Total Yükselir → Altcoin boğa sezonu başlangıcı.";
    }
    return "Trend belirsiz veya değişim yok.";
  };

  return (
    <div className="dominance-container">
      <h1 className="dominance-title">Crypto Dominance Dashboard</h1>

      {/* BTC ve ETH fiyatları */}
      <div className="price-card">
        <span className="price-label">BTCUSDT</span>
        <span className={`price-value ${btcFlash}`}>${formatNumber(btcPrice)}</span>
        <span className="price-label" style={{ marginLeft: "20px" }}>ETHUSDT</span>
        <span className={`price-value ${ethFlash}`}>${formatNumber(ethPrice)}</span>
      </div>

      {/* Tahmini değerler */}
      <div className="block">
        <div className="dominance-hint-box">
          <p>
            Aşağıdaki alanlara tahmini <strong>BTC.D</strong> (% cinsinden) ve 
            <strong> TOTAL</strong> (Trilyon $ cinsinden, örn: 2.8) değerlerini girin.  
            Bu değerler mevcut piyasa verileriyle karşılaştırılarak trend yönü hesaplanır.
          </p>
        </div>

        <div className="dashboard-grid">
          <div className="dominance-card">
            <p className="label">BTC.D (% Tahmini)</p>
            <input
              type="number"
              placeholder="örn: 50"
              value={estDominance}
              onChange={(e) => setEstDominance(e.target.value)}
              className="dominance-input"
            />
          </div>
          <div className="dominance-card">
            <p className="label">TOTAL ($ Tahmini)</p>
            <input
              type="number"
              placeholder="örn: 2.8"
              value={estTotal}
              onChange={(e) => setEstTotal(e.target.value)}
              className="dominance-input"
            />
          </div>
          <div className="dominance-card">
            <p className="label">BTC Market Cap (Tahmini)</p>
            <p className="value">${formatNumber(estBtcMarketCap)}</p>
          </div>
          <div className="dominance-card">
            <p className="label">TOTAL2 (Tahmini)</p>
            <p className="value">${formatNumber(estTotal2)}</p>
          </div>
        </div>
      </div>

      <hr className="separator" />

      {/* Mevcut değerler ve fark */}
      <div className="block">
        <div className="dashboard-grid">
          <div className="dominance-card dual">
            <div className="dual-top">
              <span>BTC.D</span>
              <span>Fark (%)</span>
            </div>
            <div className="dual-bottom">
              <span>{btcDominance.toFixed(2)}%</span>
              <span
                className={`diff-value ${
                  calcDiff(btcDominance, estDominance) >= 0 ? "flash-green" : "flash-red"
                }`}
                style={{ color: getDiffColor(calcDiff(btcDominance, estDominance)) }}
              >
                {calcDiff(btcDominance, estDominance).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="dominance-card dual">
            <div className="dual-top">
              <span>TOTAL</span>
              <span>Fark (%)</span>
            </div>
            <div className="dual-bottom">
              <span>${formatNumber(totalMarket)}</span>
              <span
                className={`diff-value ${
                  calcDiff(totalMarket, estTotalValue) >= 0 ? "flash-green" : "flash-red"
                }`}
                style={{ color: getDiffColor(calcDiff(totalMarket, estTotalValue)) }}
              >
                {calcDiff(totalMarket, estTotalValue).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="dominance-card dual">
            <div className="dual-top">
              <span>BTC Market Cap</span>
              <span>Fark (%)</span>
            </div>
            <div className="dual-bottom">
              <span>${formatNumber(btcMarketCap)}</span>
              <span
                className={`diff-value ${
                  calcDiff(btcMarketCap, estBtcMarketCap) >= 0 ? "flash-green" : "flash-red"
                }`}
                style={{ color: getDiffColor(calcDiff(btcMarketCap, estBtcMarketCap)) }}
              >
                {calcDiff(btcMarketCap, estBtcMarketCap).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="dominance-card dual">
            <div className="dual-top">
              <span>TOTAL2</span>
              <span>Fark (%)</span>
            </div>
            <div className="dual-bottom">
              <span>${formatNumber(total2)}</span>
              <span
                className={`diff-value ${
                  calcDiff(total2, estTotal2) >= 0 ? "flash-green" : "flash-red"
                }`}
                style={{ color: getDiffColor(calcDiff(total2, estTotal2)) }}
              >
                {calcDiff(total2, estTotal2).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Yorumu */}
      <div className="trend-comment">
        <p>{trendComment()}</p>
      </div>
    </div>
  );
}

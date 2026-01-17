import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

// Only initialize Supabase if credentials are valid
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase service initialized");
  } catch (error) {
    console.warn("⚠️  Supabase initialization failed. Real-time features will be limited.");
  }
} else {
  console.warn("⚠️  Supabase credentials not configured. Real-time features will be limited.");
}

export { supabase };

// Active Trades Operations
export const createActiveTrade = async (tradeData) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  const { data, error } = await supabase
    .from("active_trades")
    .insert([tradeData])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const getActiveTrades = async (advisorId = null) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  let query = supabase
    .from("active_trades")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (advisorId) {
    query = query.eq("advisor_id", advisorId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateActiveTrade = async (tradeId, updates) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  const { data, error } = await supabase
    .from("active_trades")
    .update(updates)
    .eq("id", tradeId)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteActiveTrade = async (tradeId) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  const { error } = await supabase
    .from("active_trades")
    .delete()
    .eq("id", tradeId);
  
  if (error) throw error;
  return true;
};

// Pending Trades Operations
export const createPendingTrade = async (tradeData) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  const { data, error } = await supabase
    .from("pending_trades")
    .insert([tradeData])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const getPendingTrades = async (advisorId = null) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  let query = supabase
    .from("pending_trades")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (advisorId) {
    query = query.eq("advisor_id", advisorId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const deletePendingTrade = async (tradeId) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  const { error } = await supabase
    .from("pending_trades")
    .delete()
    .eq("trade_id", tradeId);
  
  if (error) throw error;
  return true;
};

export const movePendingToActive = async (tradeId) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  // Get pending trade
  const { data: pendingTrade, error: fetchError } = await supabase
    .from("pending_trades")
    .select("*")
    .eq("id", tradeId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Create in active_trades
  const { data: activeTrade, error: createError } = await supabase
    .from("active_trades")
    .insert([{ ...pendingTrade, status: "active" }])
    .select();
  
  if (createError) throw createError;
  
  // Delete from pending_trades
  const { error: deleteError } = await supabase
    .from("pending_trades")
    .delete()
    .eq("id", tradeId);
  
  if (deleteError) throw deleteError;
  
  return activeTrade[0];
};

// Real-time subscriptions
export const subscribeToActiveTrades = (callback) => {
  if (!supabase) {
    console.warn("Supabase not configured. Real-time subscriptions disabled.");
    return null;
  }
  
  return supabase
    .channel("active_trades_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "active_trades" },
      callback
    )
    .subscribe();
};

export const subscribeToPendingTrades = (callback) => {
  if (!supabase) {
    console.warn("Supabase not configured. Real-time subscriptions disabled.");
    return null;
  }
  
  return supabase
    .channel("pending_trades_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pending_trades" },
      callback
    )
    .subscribe();
};

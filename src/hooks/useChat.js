"use client";

// ============================================================
// LAWTALK — CHAT HOOK (Supabase Real-time)
// ============================================================
// Uses Supabase Realtime for actual live messaging
// Falls back to simulation mode if lawyer is offline
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { FIRST_CHAT_PRICE } from "@/lib/constants";

export function useChat(consultationId) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [totalCharged, setTotalCharged] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  // Load existing consultation + messages
  useEffect(() => {
    if (!consultationId) return;

    const loadConsultation = async () => {
      const { data: consultation, error: cError } = await supabase
        .from("consultations")
        .select("*")
        .eq("id", consultationId)
        .single();

      if (!cError && consultation) {
        setSessionActive(consultation.status === "active");
        setTotalCharged(consultation.total_charged || 0);
      }

      const { data: msgs, error: mError } = await supabase
        .from("messages")
        .select("*")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: true });

      if (!mError) {
        setMessages((msgs || []).map(normalizeMessage));
      }
      setLoading(false);
    };

    loadConsultation();

    // Real-time subscription for new messages
    channelRef.current = supabase
      .channel(`consultation-${consultationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `consultation_id=eq.${consultationId}`,
      }, (payload) => {
        const newMsg = normalizeMessage(payload.new);
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setIsTyping(false);
        if (newMsg.sender !== "user") {
          setTotalCharged((prev) => prev + (newMsg.charge || 0));
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "consultations",
        filter: `id=eq.${consultationId}`,
      }, (payload) => {
        setSessionActive(payload.new.status === "active");
        setTotalCharged(payload.new.total_charged || 0);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [consultationId]);

  function normalizeMessage(row) {
    return {
      id: row.id,
      content: row.content,
      sender: row.sender_type,
      senderId: row.sender_id,
      timestamp: row.created_at,
      charge: row.charge || 0,
      isRead: row.is_read,
    };
  }

  // Start a new consultation session
  const startSession = useCallback(async (userId, lawyerId, lawyerName) => {
    // Check if consultation already exists (avoid duplicates)
    if (consultationId) {
      const { data } = await supabase
        .from("consultations")
        .select("id, status, total_charged")
        .eq("id", consultationId)
        .single();

      if (data) {
        setSessionActive(data.status === "active");
        setTotalCharged(data.total_charged || 0);
        return { consultationId, existing: true };
      }
    }

    const { data, error } = await supabase
      .from("consultations")
      .insert({
        id: consultationId, // use the pre-generated ID
        user_id: userId,
        lawyer_id: lawyerId,
        status: "active",
        total_charged: 0,
        message_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to start session:", error);
      return { error };
    }

    setSessionActive(true);
    setTotalCharged(0);
    return { consultationId: data.id };
  }, [consultationId]);

  // Send a message
  const sendMessage = useCallback(async (content, sender, userId, isFirstMessage, pricePerMinute) => {
    const charge = isFirstMessage && messages.length === 0
      ? FIRST_CHAT_PRICE
      : Math.round(pricePerMinute * 0.5);

    const userCharge = sender === "user" ? charge : 0;

    // Insert message into Supabase
    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        consultation_id: consultationId,
        sender_type: sender,
        sender_id: userId,
        content,
        charge: userCharge,
      })
      .select()
      .single();

    if (error) {
      console.error("Message send error:", error);
      return { error, charged: 0 };
    }

    // Update consultation totals
    const newTotal = totalCharged + userCharge;
    await supabase
      .from("consultations")
      .update({
        total_charged: newTotal,
        message_count: messages.length + 1,
      })
      .eq("id", consultationId);

    setTotalCharged(newTotal);

    // Simulate lawyer auto-reply (remove when real lawyer connects)
    if (sender === "user") {
      setIsTyping(true);
      const delay = 1500 + Math.random() * 2000;
      setTimeout(async () => {
        const lawyerReplies = [
          "Thank you for reaching out. Could you please provide more details about your situation?",
          "I understand your concern. Based on what you've described, here is my initial advice...",
          "This is a common legal issue. Let me explain the relevant sections of the law.",
          "I would recommend gathering these documents first before proceeding.",
          "Under the current legal framework, you have the following options available to you.",
          "Please note that this constitutes preliminary legal advice. For a complete assessment, more details would be needed.",
        ];

        await supabase.from("messages").insert({
          consultation_id: consultationId,
          sender_type: "lawyer",
          sender_id: "00000000-0000-0000-0000-000000000001", // system placeholder
          content: lawyerReplies[Math.floor(Math.random() * lawyerReplies.length)],
          charge: 0,
        });
        setIsTyping(false);
      }, delay);
    }

    return { charged: userCharge };
  }, [consultationId, messages.length, totalCharged]);

  // End session
  const endSession = useCallback(async (rating = 0) => {
    const { error } = await supabase
      .from("consultations")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        rating: rating || null,
      })
      .eq("id", consultationId);

    if (!error) setSessionActive(false);
    return { error };
  }, [consultationId]);

  return {
    messages,
    isTyping,
    sessionActive,
    totalCharged,
    loading,
    sendMessage,
    startSession,
    endSession,
  };
}

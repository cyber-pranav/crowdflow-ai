// ============================================================
// AI ASSISTANT — Gemini-powered context-aware helper
// ============================================================
// Injects live stadium data (density, queues, predictions) as
// context into every Gemini API call. Falls back to rule-based
// responses when no API key is configured.
// ============================================================

import { getGeminiModel } from '../config/gemini';
import { crowdDensityEngine } from './crowdDensityEngine';
import { predictiveEngine } from './predictiveEngine';
import { smartRouter } from './smartRouter';
import { queueOptimizer } from './queueOptimizer';
import { stadiumGraph, ZoneType } from '../models/stadiumGraph';
import { VendorType } from '../models/vendor';
import { logger } from '../utils/logger';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  contextUsed?: string[];
}

export interface AssistantResponse {
  message: string;
  contextUsed: string[];
  suggestions: string[];
  routeData?: any;
  vendorData?: any;
}

export class AIAssistant {
  private conversationHistory: ChatMessage[] = [];

  /**
   * Process a user query with full stadium context
   */
  async processQuery(userMessage: string, userZoneId?: string): Promise<AssistantResponse> {
    const context = this.buildLiveContext(userZoneId);
    const contextUsed: string[] = [];

    // Try Gemini API first
    const model = getGeminiModel();
    if (model) {
      try {
        const systemPrompt = this.buildSystemPrompt(context);
        const chat = model.startChat({
          history: this.conversationHistory.slice(-6).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 500,
          },
        });

        const prompt = `${systemPrompt}\n\nUser question: ${userMessage}`;
        const result = await chat.sendMessage(prompt);
        const responseText = result.response.text();

        this.addToHistory('user', userMessage);
        this.addToHistory('assistant', responseText);

        contextUsed.push('Gemini AI', 'Live density data', 'Queue data');

        return {
          message: responseText,
          contextUsed,
          suggestions: this.generateSuggestions(userMessage),
        };
      } catch (error) {
        logger.warn('Gemini API call failed, using fallback', error);
      }
    }

    // Fallback: Rule-based responses
    return this.fallbackResponse(userMessage, userZoneId, context);
  }

  /**
   * Build the system prompt with live stadium context
   */
  private buildSystemPrompt(context: string): string {
    return `You are CrowdFlow AI, an intelligent stadium assistant. You help spectators navigate the stadium, find food, avoid crowds, and have the best experience.

IMPORTANT RULES:
- Be concise and helpful. Keep responses under 150 words.
- Use the LIVE DATA below to give accurate, real-time advice.
- When recommending locations, mention current crowd levels and wait times.
- When suggesting routes, mention estimated walk time.
- If asked about exits, always consider current crowd density.
- Use emojis sparingly for readability (🟢 low, 🟡 medium, 🔴 high crowd).
- If you don't know something, say so honestly.

LIVE STADIUM DATA:
${context}`;
  }

  /**
   * Build live context string from all intelligence engines
   */
  private buildLiveContext(userZoneId?: string): string {
    const heatmap = crowdDensityEngine.generateHeatmapData();
    const alerts = predictiveEngine.getActiveAlerts();
    const queueData = queueOptimizer.getAllQueueData();

    let context = `\n--- CROWD DENSITY ---\n`;
    context += `Total Users: ${heatmap.totalUsers} | Overall Density: ${heatmap.overallDensity}%\n`;
    context += `Hotspots: ${heatmap.hotspots.length > 0 ? heatmap.hotspots.join(', ') : 'None'}\n`;

    for (const zone of heatmap.zones) {
      if (zone.currentOccupancy > 0) {
        context += `  ${zone.zoneName}: ${zone.densityLevel} (${zone.occupancyPercent}%) [${zone.trend}]\n`;
      }
    }

    context += `\n--- PREDICTION ALERTS ---\n`;
    if (alerts.length === 0) {
      context += `  No active alerts\n`;
    } else {
      for (const alert of alerts.slice(0, 5)) {
        context += `  ⚠️ ${alert.zoneName}: Expected ${alert.predictedDensity} in ${alert.timeUntilMinutes} min (${Math.round(alert.confidence * 100)}% confidence) - ${alert.reason}\n`;
      }
    }

    context += `\n--- VENDOR QUEUES ---\n`;
    for (const q of queueData) {
      const waitMin = Math.round(q.waitTimeSeconds / 60 * 10) / 10;
      context += `  ${q.vendorName}: ${waitMin} min wait, ${q.queueLength} in queue [${q.trend}]\n`;
    }

    if (userZoneId) {
      context += `\n--- USER LOCATION ---\n`;
      const zone = stadiumGraph.getZone(userZoneId);
      if (zone) {
        context += `  Currently at: ${zone.name} (${zone.densityLevel} density)\n`;
      }
    }

    return context;
  }

  /**
   * Rule-based fallback responses
   */
  private fallbackResponse(query: string, userZoneId?: string, _context?: string): AssistantResponse {
    const lowerQuery = query.toLowerCase();
    const contextUsed: string[] = ['Rule-based engine', 'Live data'];

    // Food-related queries
    if (lowerQuery.includes('food') || lowerQuery.includes('eat') || lowerQuery.includes('hungry')) {
      const rankings = queueOptimizer.getRankings(userZoneId, VendorType.FOOD);
      const top = rankings.slice(0, 3);

      let response = `🍔 Here are my top food recommendations right now:\n\n`;
      for (let i = 0; i < top.length; i++) {
        const r = top[i];
        const emoji = r.recommended ? '⭐' : `${i + 1}.`;
        response += `${emoji} **${r.vendor.name}** — ${r.waitTimeMinutes} min wait`;
        if (r.reason) response += ` (${r.reason})`;
        response += `\n`;
      }

      return {
        message: response,
        contextUsed,
        suggestions: ['Show me the route', 'Any drinks nearby?', 'Which exit is fastest?'],
        vendorData: top,
      };
    }

    // Drink-related queries
    if (lowerQuery.includes('drink') || lowerQuery.includes('beer') || lowerQuery.includes('beverage')) {
      const rankings = queueOptimizer.getRankings(userZoneId, VendorType.BEVERAGE);
      const top = rankings.slice(0, 3);

      let response = `🥤 Best drink options right now:\n\n`;
      for (const r of top) {
        response += `${r.recommended ? '⭐' : '•'} **${r.vendor.name}** — ${r.waitTimeMinutes} min wait\n`;
      }

      return { message: response, contextUsed, suggestions: ['What food is nearby?', 'Show route'], vendorData: top };
    }

    // Exit-related queries
    if (lowerQuery.includes('exit') || lowerQuery.includes('leave') || lowerQuery.includes('gate')) {
      const gates = stadiumGraph.getZonesByType(ZoneType.GATE);
      let response = `🚪 Current exit status:\n\n`;

      for (const gate of gates) {
        const emoji = gate.densityLevel === 'LOW' ? '🟢' : gate.densityLevel === 'MEDIUM' ? '🟡' : '🔴';
        response += `${emoji} **${gate.name}**: ${gate.densityLevel} density (${Math.round(gate.currentOccupancy / gate.capacity * 100)}% full)\n`;
      }

      if (userZoneId) {
        const emergency = smartRouter.findEmergencyRoute(userZoneId);
        if (emergency.routes.length > 0) {
          const best = emergency.routes[0];
          response += `\n✅ **Fastest exit**: ${best.path[best.path.length - 1].zoneName} — ${Math.round(best.totalTimeSeconds / 60)} min walk`;
        }
      }

      return { message: response, contextUsed, suggestions: ['When should I leave?', 'Show emergency exits'], routeData: null };
    }

    // Route-related queries
    if (lowerQuery.includes('route') || lowerQuery.includes('how to get') || lowerQuery.includes('navigate') || lowerQuery.includes('direction')) {
      if (userZoneId) {
        return {
          message: `📍 You're at **${stadiumGraph.getZone(userZoneId)?.name}**. Where would you like to go? I can find the best route avoiding crowded areas.\n\nTry asking: "How do I get to the North Food Court?"`,
          contextUsed,
          suggestions: ['Take me to food', 'Nearest restroom', 'Gate A'],
        };
      }
      return {
        message: `📍 I can help you navigate! Tell me where you are and where you'd like to go.`,
        contextUsed,
        suggestions: ['Where is the food court?', 'Fastest exit?'],
      };
    }

    // Crowd-related queries
    if (lowerQuery.includes('crowd') || lowerQuery.includes('busy') || lowerQuery.includes('packed')) {
      const heatmap = crowdDensityEngine.generateHeatmapData();
      let response = `📊 Current crowd overview:\n\n`;
      response += `👥 **${heatmap.totalUsers} total users** | Overall density: **${heatmap.overallDensity}%**\n\n`;

      if (heatmap.hotspots.length > 0) {
        response += `🔴 **Crowded areas**: ${heatmap.hotspots.map(id => stadiumGraph.getZone(id)?.name).join(', ')}\n`;
      } else {
        response += `🟢 No overcrowded areas right now!\n`;
      }

      return { message: response, contextUsed, suggestions: ['Where is it least crowded?', 'Predictions?'] };
    }

    // When to leave
    if (lowerQuery.includes('when') && (lowerQuery.includes('leave') || lowerQuery.includes('depart'))) {
      const exitPredictions = predictiveEngine.generateExitPredictions();
      let response = `⏱️ Exit timing recommendations:\n\n`;
      for (const ep of exitPredictions) {
        response += `• **${ep.gateName}**: Currently ${ep.currentWaitMinutes} min wait`;
        if (ep.predictedWaitMinutes > ep.currentWaitMinutes) {
          response += ` → predicted **${ep.predictedWaitMinutes} min** soon`;
        }
        response += `\n`;
      }

      const best = exitPredictions.sort((a, b) => a.currentWaitMinutes - b.currentWaitMinutes)[0];
      if (best) {
        response += `\n✅ ${best.recommendation}`;
      }

      return { message: response, contextUsed, suggestions: ['Show me the route', 'Which gate?'] };
    }

    // Default response
    return {
      message: `👋 I'm **CrowdFlow AI**, your smart stadium assistant! I can help you with:\n\n🍔 **Finding food** with shortest wait times\n🚪 **Fastest exits** avoiding crowds\n📍 **Smart routing** around congested areas\n📊 **Crowd updates** and predictions\n⏱️ **When to leave** to avoid the rush\n\nWhat would you like to know?`,
      contextUsed: ['Rule-based engine'],
      suggestions: ['Where should I eat?', 'Which exit is fastest?', 'How crowded is it?', 'When should I leave?'],
    };
  }

  /**
   * Generate follow-up suggestions based on the query
   */
  private generateSuggestions(query: string): string[] {
    const lower = query.toLowerCase();
    if (lower.includes('food') || lower.includes('eat')) {
      return ['Show me the route', 'Any drinks nearby?', 'Which exit is fastest?'];
    }
    if (lower.includes('exit') || lower.includes('leave')) {
      return ['When should I leave?', 'Show crowd map', 'Find food first'];
    }
    return ['Where should I eat?', 'Which exit is fastest?', 'How crowded is it?'];
  }

  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({ role, content, timestamp: Date.now() });
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }
}

export const aiAssistant = new AIAssistant();

// ============================================================
// Q-Learning Reinforcement Learning Agent
// Learns optimal traffic signal phase & duration decisions
// ============================================================

class QLearningAgent {
  constructor() {
    // Q-table: maps state-action pairs to expected rewards
    this.qTable = {};

    // Hyperparameters
    this.learningRate = 0.1;      // alpha — how fast we learn
    this.discountFactor = 0.95;   // gamma — how much we value future rewards
    this.epsilon = 1.0;           // exploration rate (start fully random)
    this.epsilonDecay = 0.9995;   // decay per decision
    this.epsilonMin = 0.05;       // minimum exploration

    // Duration options the agent can choose (ms)
    this.durationOptions = [3000, 5000, 8000, 12000, 15000];

    // Stats tracking
    this.totalDecisions = 0;
    this.totalReward = 0;
    this.rewardHistory = [];       // rolling window of recent rewards
    this.avgReward = 0;
    this.bestAvgReward = -Infinity;
    this.explorationCount = 0;
    this.exploitationCount = 0;

    // Previous state-action for learning
    this.prevState = null;
    this.prevAction = null;
    this.prevTotalWaiting = 0;

    // Cumulative wait tracking for reward calculation
    this.waitAccumulator = 0;
    this.waitSamples = 0;
  }

  // Discretize queue counts into bins: 0, 1-2, 3-5, 6+
  _binCount(n) {
    if (n === 0) return 0;
    if (n <= 2) return 1;
    if (n <= 5) return 2;
    return 3;
  }

  // Build a state string from the current traffic situation
  getState(vehicleQueues, pedestrianQueues, currentPhase) {
    const nsV = this._binCount(vehicleQueues.north.length + vehicleQueues.south.length);
    const ewV = this._binCount(vehicleQueues.east.length + vehicleQueues.west.length);
    const nP  = this._binCount(pedestrianQueues.north.length + pedestrianQueues.south.length);
    const eP  = this._binCount(pedestrianQueues.east.length + pedestrianQueues.west.length);
    return `${nsV}_${ewV}_${nP}_${eP}_${currentPhase}`;
  }

  // Get all possible actions: [phase, durationIndex]
  _getActions() {
    const actions = [];
    for (let phase = 0; phase < 3; phase++) {
      for (let di = 0; di < this.durationOptions.length; di++) {
        actions.push(`${phase}_${di}`);
      }
    }
    return actions;
  }

  // Get Q-value for a state-action pair
  _getQ(state, action) {
    const key = `${state}|${action}`;
    if (!(key in this.qTable)) this.qTable[key] = 0;
    return this.qTable[key];
  }

  // Set Q-value
  _setQ(state, action, value) {
    this.qTable[`${state}|${action}`] = value;
  }

  // Find best action for a state
  _bestAction(state) {
    const actions = this._getActions();
    let bestA = actions[0];
    let bestQ = this._getQ(state, bestA);
    for (let i = 1; i < actions.length; i++) {
      const q = this._getQ(state, actions[i]);
      if (q > bestQ) { bestQ = q; bestA = actions[i]; }
    }
    return { action: bestA, qValue: bestQ };
  }

  // Calculate reward based on how well we're reducing wait times
  _calculateReward(vehicleQueues, pedestrianQueues, entitiesCleared) {
    const directions = ['north', 'south', 'east', 'west'];
    const totalWaiting =
      directions.reduce((s, d) => s + vehicleQueues[d].length, 0) +
      directions.reduce((s, d) => s + pedestrianQueues[d].length, 0);

    // Reward components:
    // 1. Negative reward for entities still waiting (pressure to clear)
    const waitPenalty = -totalWaiting * 0.5;

    // 2. Positive reward for entities cleared during last phase
    const clearBonus = entitiesCleared * 2.0;

    // 3. Penalty for letting any single queue get very long (fairness)
    let maxQueue = 0;
    directions.forEach(d => {
      maxQueue = Math.max(maxQueue, vehicleQueues[d].length, pedestrianQueues[d].length);
    });
    const fairnessPenalty = maxQueue > 6 ? -(maxQueue - 6) * 1.5 : 0;

    // 4. Bonus for keeping all queues near zero
    const allClear = totalWaiting === 0 ? 5.0 : 0;

    return waitPenalty + clearBonus + fairnessPenalty + allClear;
  }

  // Record how many entities are waiting (called each frame for accurate tracking)
  recordWaiting(vehicleQueues, pedestrianQueues) {
    const directions = ['north', 'south', 'east', 'west'];
    const total =
      directions.reduce((s, d) => s + vehicleQueues[d].length, 0) +
      directions.reduce((s, d) => s + pedestrianQueues[d].length, 0);
    this.waitAccumulator += total;
    this.waitSamples++;
    return total;
  }

  // Main decision function — called when a new phase needs to be chosen
  decide(vehicleQueues, pedestrianQueues, currentPhase, entitiesCleared) {
    const state = this.getState(vehicleQueues, pedestrianQueues, currentPhase);

    // ---- Learn from previous decision ----
    if (this.prevState !== null) {
      const reward = this._calculateReward(vehicleQueues, pedestrianQueues, entitiesCleared);
      const oldQ = this._getQ(this.prevState, this.prevAction);
      const bestNext = this._bestAction(state).qValue;
      // Q-Learning update rule
      const newQ = oldQ + this.learningRate * (reward + this.discountFactor * bestNext - oldQ);
      this._setQ(this.prevState, this.prevAction, newQ);

      // Track stats
      this.totalReward += reward;
      this.rewardHistory.push(reward);
      if (this.rewardHistory.length > 100) this.rewardHistory.shift();
      this.avgReward = this.rewardHistory.reduce((a, b) => a + b, 0) / this.rewardHistory.length;
      if (this.avgReward > this.bestAvgReward) this.bestAvgReward = this.avgReward;
    }

    // ---- Choose action: epsilon-greedy ----
    let actionStr;
    if (Math.random() < this.epsilon) {
      // Explore: random action
      const actions = this._getActions();
      actionStr = actions[Math.floor(Math.random() * actions.length)];
      this.explorationCount++;
    } else {
      // Exploit: best known action
      actionStr = this._bestAction(state).action;
      this.exploitationCount++;
    }

    // Decay epsilon
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
    this.totalDecisions++;

    // Save for next learning step
    this.prevState = state;
    this.prevAction = actionStr;

    // Parse action
    const [phaseStr, durIdxStr] = actionStr.split('_');
    const phase = parseInt(phaseStr);
    const duration = this.durationOptions[parseInt(durIdxStr)];

    return { phase, duration };
  }

  // Get stats for display
  getStats() {
    return {
      decisions: this.totalDecisions,
      epsilon: this.epsilon,
      avgReward: this.avgReward,
      bestAvgReward: this.bestAvgReward,
      qTableSize: Object.keys(this.qTable).length,
      explorationRate: this.totalDecisions > 0
        ? ((this.explorationCount / this.totalDecisions) * 100).toFixed(1)
        : '0.0',
      exploitationRate: this.totalDecisions > 0
        ? ((this.exploitationCount / this.totalDecisions) * 100).toFixed(1)
        : '0.0',
    };
  }

  // Export Q-table to JSON (for saving/loading learned knowledge)
  exportModel() {
    return JSON.stringify({
      qTable: this.qTable,
      epsilon: this.epsilon,
      totalDecisions: this.totalDecisions,
      totalReward: this.totalReward,
    });
  }

  // Import a previously trained Q-table
  importModel(json) {
    const data = JSON.parse(json);
    this.qTable = data.qTable;
    this.epsilon = data.epsilon;
    this.totalDecisions = data.totalDecisions;
    this.totalReward = data.totalReward;
  }
}

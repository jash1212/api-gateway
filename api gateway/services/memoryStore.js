class MemoryStore {
  constructor() {
    this.requestMap = new Map();
    this.scoreMap = new Map();
    this.blockedIPs = new Map();
    this.offenseMap = new Map();
    this.endpointMap = new Map();
    this.totalRequests = 0;

    // Start automatic cleanup & decay
    this.startScoreDecay();
    this.startEndpointCleanup();
  }

  /* ---------------------------------------------------
     REQUEST METRICS
  --------------------------------------------------- */

  incrementTotalRequests() {
    this.totalRequests++;
  }

  getTotalRequests() {
    return this.totalRequests;
  }

  /* ---------------------------------------------------
     ENDPOINT DATA
  --------------------------------------------------- */

  getEndpointData(ip) {
    return this.endpointMap.get(ip);
  }

  setEndpointData(ip, data) {
    this.endpointMap.set(ip, data);
  }

  resetEndpointData(ip) {
    this.endpointMap.delete(ip);
  }

  /* ---------------------------------------------------
     REQUEST DATA (optional future use)
  --------------------------------------------------- */

  getRequestData(ip) {
    return this.requestMap.get(ip);
  }

  setRequestData(ip, data) {
    this.requestMap.set(ip, data);
  }

  resetRequestData(ip) {
    this.requestMap.delete(ip);
  }

  /* ---------------------------------------------------
     ABUSE SCORE
  --------------------------------------------------- */

  getScore(ip) {
    return this.scoreMap.get(ip) || 0;
  }

  increaseScore(ip, value) {
    const current = this.getScore(ip);
    this.scoreMap.set(ip, current + value);
  }

  resetScore(ip) {
    this.scoreMap.delete(ip);
  }

  getAllScores() {
    return this.scoreMap;
  }

  /* ---------------------------------------------------
     BLOCKLIST
  --------------------------------------------------- */

  blockIP(ip, until) {
    this.blockedIPs.set(ip, until);
  }

  isBlocked(ip) {
    const expiry = this.blockedIPs.get(ip);
    if (!expiry) return false;

    if (Date.now() > expiry) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return true;
  }

  getBlockRemainingTime(ip) {
    const expiry = this.blockedIPs.get(ip);
    if (!expiry) return 0;

    return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
  }

  getBlockedIPs() {
    return this.blockedIPs;
  }

  /* ---------------------------------------------------
     OFFENSE TRACKING
  --------------------------------------------------- */

  getOffenseCount(ip) {
    return this.offenseMap.get(ip) || 0;
  }

  increaseOffense(ip) {
    const current = this.getOffenseCount(ip);
    this.offenseMap.set(ip, current + 1);
  }

  /* ---------------------------------------------------
     AUTOMATIC SCORE DECAY (VERY IMPORTANT)
  --------------------------------------------------- */

  startScoreDecay() {
    setInterval(() => {
      this.scoreMap.forEach((score, ip) => {
        const newScore = Math.max(0, score - 1);

        if (newScore === 0) {
          this.scoreMap.delete(ip);
        } else {
          this.scoreMap.set(ip, newScore);
        }
      });
    }, 60 * 1000); // every minute
  }

  /* ---------------------------------------------------
     ENDPOINT DATA CLEANUP
  --------------------------------------------------- */

  startEndpointCleanup() {
    setInterval(() => {
      const now = Date.now();

      this.endpointMap.forEach((data, ip) => {
        let active = false;

        Object.values(data).forEach((endpoint) => {
          if (now - endpoint.lastSeen < 5 * 60 * 1000) {
            active = true;
          }
        });

        if (!active) {
          this.endpointMap.delete(ip);
        }
      });
    }, 5 * 60 * 1000); // every 5 mins
  }
}

module.exports = new MemoryStore();
